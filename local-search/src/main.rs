mod embedder;
mod index_builder;
mod vector_store;

use std::{net::SocketAddr, path::PathBuf, sync::Arc, time::Duration};

use axum::{
  extract::State,
  http::{HeaderValue, Method},
  routing::{get, post},
  Json, Router,
};
use clap::{Parser, Subcommand};
use embedder::BgeM3Embedder;
use serde::{Deserialize, Serialize};
use tokio::signal;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tracing::{info, warn};
use vector_store::VectorStore;

#[derive(Parser, Debug)]
#[command(name = "litomi-local-search")]
#[command(about = "Local semantic search server (bge-m3 + FlatIP).", long_about = None)]
struct Cli {
  #[command(subcommand)]
  command: Command,
}

#[derive(Subcommand, Debug)]
enum Command {
  Serve(ServeArgs),
  BuildIndex(BuildIndexArgs),
}

#[derive(Parser, Debug)]
struct ServeArgs {
  /// Data directory containing `model/` and `index/`.
  #[arg(long, default_value = "data")]
  data_dir: String,

  /// Base port to try (falls back to 17777). Overrides `LITOMI_PORT` if provided.
  #[arg(long, env = "LITOMI_PORT")]
  port: Option<u16>,

  /// Max port to try (inclusive) when probing.
  #[arg(long, default_value_t = 17877)]
  max_port: u16,

  /// Optional onnxruntime dynamic library path (recommended for `ort` load-dynamic).
  #[arg(long)]
  ort_dylib: Option<String>,

  /// Max token length for queries.
  #[arg(long, default_value_t = 512)]
  query_max_length: usize,
}

#[derive(Parser, Debug)]
struct BuildIndexArgs {
  /// Input corpus (JSONL; or plain .txt as a single-doc fallback).
  #[arg(long)]
  input: String,

  /// Output directory (default: data/index).
  #[arg(long, default_value = "data/index")]
  out: String,

  /// Model directory containing `bge-m3.onnx` and `tokenizer.json`.
  #[arg(long, default_value = "data/model")]
  model_dir: String,

  /// Optional onnxruntime dynamic library path (recommended for `ort` load-dynamic).
  #[arg(long)]
  ort_dylib: Option<String>,

  /// Max token length for documents during indexing.
  #[arg(long, default_value_t = 1024)]
  doc_max_length: usize,
}

struct AppState {
  version: &'static str,
  model_id: &'static str,
  dims: usize,
  docs: usize,
  query_max_length: usize,
  embedder: std::sync::Mutex<BgeM3Embedder>,
  vectors: Arc<VectorStore>,
  sqlite_path: PathBuf,
}

#[derive(Serialize)]
struct HealthzResponse {
  ok: bool,
  version: String,
  model: HealthzModel,
  index: HealthzIndex,
}

#[derive(Serialize)]
struct HealthzModel {
  id: String,
  dims: u32,
}

#[derive(Serialize)]
struct HealthzIndex {
  r#type: String,
  docs: u64,
}

#[derive(Deserialize)]
struct EmbedRequest {
  text: String,
  #[serde(default = "default_true")]
  normalize: bool,
}

fn default_true() -> bool {
  true
}

#[derive(Serialize)]
struct EmbedResponse {
  dims: u32,
  normalized: bool,
  embedding: Vec<f32>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SearchRequest {
  query: String,
  #[serde(default = "default_top_k")]
  top_k: u32,
  #[serde(default)]
  include_snippet: bool,
}

fn default_top_k() -> u32 {
  10
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SearchResponse {
  query: String,
  top_k: u32,
  took_ms: u64,
  hits: Vec<SearchHit>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SearchHit {
  rank: u32,
  doc_id: String,
  score: f32,
  manga: MangaMeta,
  #[serde(skip_serializing_if = "Option::is_none")]
  chunk: Option<ChunkMeta>,
}

#[derive(Serialize)]
struct MangaMeta {
  id: i64,
  title: String,
  source: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ChunkMeta {
  id: u32,
  text: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  tracing_subscriber::fmt()
    .with_env_filter(
      tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| "info,litomi_local_search=info".into()),
    )
    .init();

  let cli = Cli::parse();

  match cli.command {
    Command::Serve(args) => serve(args).await?,
    Command::BuildIndex(args) => {
      let model_dir = PathBuf::from(args.model_dir);
      let model_path = model_dir.join("bge-m3.onnx");
      let tokenizer_path = model_dir.join("tokenizer.json");
      let out_dir = PathBuf::from(args.out);

      index_builder::build_index(index_builder::BuildIndexConfig {
        input: PathBuf::from(args.input),
        out_dir,
        model_path,
        tokenizer_path,
        ort_dylib_path: args.ort_dylib.map(PathBuf::from),
        doc_max_length: args.doc_max_length,
      })?;

      warn!("build-index completed");
    }
  }

  Ok(())
}

async fn serve(args: ServeArgs) -> anyhow::Result<()> {
  let port = args.port.unwrap_or(17777);
  let addr = pick_listen_addr(port, args.max_port)?;

  let data_dir = PathBuf::from(&args.data_dir);
  let model_dir = data_dir.join("model");
  let index_dir = data_dir.join("index");

  let model_path = model_dir.join("bge-m3.onnx");
  let tokenizer_path = model_dir.join("tokenizer.json");
  let sqlite_path = index_dir.join("doc_meta.sqlite");
  let vectors_path = index_dir.join("vectors.f32");

  let ort_dylib = args.ort_dylib.as_ref().map(PathBuf::from);
  let embedder = BgeM3Embedder::new(
    &model_path,
    &tokenizer_path,
    ort_dylib.as_deref(),
  )?;

  let vectors = VectorStore::open(&vectors_path, 1024)?;
  let docs = vectors.len();

  let state = Arc::new(AppState {
    version: "0.1.0",
    model_id: "BAAI/bge-m3",
    dims: 1024,
    docs,
    query_max_length: args.query_max_length,
    embedder: std::sync::Mutex::new(embedder),
    vectors: Arc::new(vectors),
    sqlite_path,
  });

  let cors = CorsLayer::new()
    .allow_methods([Method::GET, Method::POST])
    .allow_headers(tower_http::cors::Any)
    .allow_origin(AllowOrigin::predicate(|origin: &HeaderValue, _| {
      let Ok(origin) = origin.to_str() else {
        return false;
      };

      origin.starts_with("http://127.0.0.1:")
        || origin.starts_with("http://localhost:")
        || origin.starts_with("https://127.0.0.1:")
        || origin.starts_with("https://localhost:")
    }));

  let app = Router::new()
    .route("/healthz", get(healthz))
    .route("/api/embed", post(api_embed))
    .route("/api/search", post(api_search))
    .with_state(state)
    .layer(cors);

  info!(
    bind = %addr,
    data_dir = %args.data_dir,
    "starting local search server"
  );

  let listener = tokio::net::TcpListener::bind(addr).await?;
  axum::serve(listener, app)
    .with_graceful_shutdown(shutdown_signal())
    .await?;

  Ok(())
}

fn pick_listen_addr(start_port: u16, max_port: u16) -> anyhow::Result<SocketAddr> {
  let max_port = max_port.max(start_port);

  for port in start_port..=max_port {
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    if std::net::TcpListener::bind(addr).is_ok() {
      return Ok(addr);
    }
  }

  anyhow::bail!("no available port in range {}..={}", start_port, max_port)
}

async fn shutdown_signal() {
  let ctrl_c = async {
    let _ = signal::ctrl_c().await;
  };

  #[cfg(unix)]
  let terminate = async {
    let _ = signal::unix::signal(signal::unix::SignalKind::terminate())
      .expect("failed to install SIGTERM handler")
      .recv()
      .await;
  };

  #[cfg(not(unix))]
  let terminate = std::future::pending::<()>();

  tokio::select! {
    _ = ctrl_c => {},
    _ = terminate => {},
  }

  tokio::time::sleep(Duration::from_millis(50)).await;
}

async fn healthz(State(state): State<Arc<AppState>>) -> Json<HealthzResponse> {
  Json(HealthzResponse {
    ok: true,
    version: state.version.to_string(),
    model: HealthzModel {
      id: state.model_id.to_string(),
      dims: state.dims as u32,
    },
    index: HealthzIndex {
      r#type: "FlatIP (in-process)".to_string(),
      docs: state.docs as u64,
    },
  })
}

async fn api_embed(
  State(state): State<Arc<AppState>>,
  Json(req): Json<EmbedRequest>,
) -> Result<Json<EmbedResponse>, (axum::http::StatusCode, Json<serde_json::Value>)> {
  let text = req.text.trim();
  if text.is_empty() {
    return Err(problem(400, "Bad Request", "text is required", "/api/embed"));
  }

  let text = text.to_string();
  let normalize = req.normalize;
  let max_len = state.query_max_length;

  let state2 = state.clone();
  let embedding = tokio::task::spawn_blocking(move || -> anyhow::Result<Vec<f32>> {
    let mut guard = state2
      .embedder
      .lock()
      .map_err(|_| anyhow::anyhow!("embedder lock poisoned"))?;
    let mut v = guard.embed_dense_cls(&text, max_len)?;
    if normalize {
      l2_normalize_in_place(&mut v);
    }
    Ok(v)
  })
  .await
  .map_err(|_| problem(500, "Internal Server Error", "embed task failed", "/api/embed"))?
  .map_err(|e| problem(500, "Internal Server Error", &format!("{e}"), "/api/embed"))?;

  Ok(Json(EmbedResponse {
    dims: state.dims as u32,
    normalized: req.normalize,
    embedding,
  }))
}

async fn api_search(
  State(state): State<Arc<AppState>>,
  Json(req): Json<SearchRequest>,
) -> Result<Json<SearchResponse>, (axum::http::StatusCode, Json<serde_json::Value>)> {
  let started = std::time::Instant::now();

  let query = req.query.trim();
  if query.chars().count() < 2 {
    return Err(problem(
      400,
      "Bad Request",
      "query must be at least 2 chars",
      "/api/search",
    ));
  }

  let top_k = req.top_k.clamp(1, 50);
  let include_snippet = req.include_snippet;
  let query_str = query.to_string();
  let max_len = state.query_max_length;
  let sqlite_path = state.sqlite_path.clone();
  let vectors = state.vectors.clone();

  let state2 = state.clone();
  let hits = tokio::task::spawn_blocking(move || -> anyhow::Result<Vec<SearchHit>> {
    let mut guard = state2
      .embedder
      .lock()
      .map_err(|_| anyhow::anyhow!("embedder lock poisoned"))?;
    let qv = guard.embed_dense_cls_normalized(&query_str, max_len)?;

    let scored = vectors.search_top_k(&qv, top_k as usize)?;

    let conn = rusqlite::Connection::open_with_flags(
      sqlite_path,
      rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
    )?;

    let mut stmt = conn.prepare(
      r#"
SELECT doc.doc_id, doc.manga_id, doc.title, doc.text
FROM vec_map
JOIN doc ON vec_map.doc_id = doc.doc_id
WHERE vec_map.row = ?1
"#,
    )?;

    let mut out = Vec::with_capacity(scored.len());
    for (rank0, (row, score)) in scored.into_iter().enumerate() {
      let (doc_id, manga_id, title, text): (String, i64, String, String) = stmt.query_row(
        [row as i64],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
      )?;

      let chunk = if include_snippet {
        let snippet: String = text.chars().take(200).collect();
        Some(ChunkMeta { id: 0, text: snippet })
      } else {
        None
      };

      out.push(SearchHit {
        rank: (rank0 as u32) + 1,
        doc_id,
        score,
        manga: MangaMeta {
          id: manga_id,
          title,
          source: "local".to_string(),
        },
        chunk,
      });
    }

    Ok(out)
  })
  .await
  .map_err(|_| problem(500, "Internal Server Error", "search task failed", "/api/search"))?
  .map_err(|e| problem(500, "Internal Server Error", &format!("{e}"), "/api/search"))?;

  Ok(Json(SearchResponse {
    query: query.to_string(),
    top_k,
    took_ms: started.elapsed().as_millis() as u64,
    hits,
  }))
}

fn l2_normalize_in_place(v: &mut [f32]) {
  let mut sum_sq = 0.0_f32;
  for &x in v.iter() {
    sum_sq += x * x;
  }
  let norm = sum_sq.sqrt();
  if norm <= 0.0 {
    return;
  }
  for x in v.iter_mut() {
    *x /= norm;
  }
}

fn problem(
  status: u16,
  title: &str,
  detail: &str,
  instance: &str,
) -> (axum::http::StatusCode, Json<serde_json::Value>) {
  let status_code = axum::http::StatusCode::from_u16(status).unwrap_or(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
  (
    status_code,
    Json(serde_json::json!({
      "type": "about:blank",
      "title": title,
      "status": status,
      "detail": detail,
      "instance": instance
    })),
  )
}
