use std::{
  fs::{self, File},
  io::{BufRead, BufReader, BufWriter, Read, Write},
  path::{Path, PathBuf},
};

use bytemuck::cast_slice;
use rusqlite::{params, Connection};

use crate::embedder::BgeM3Embedder;

#[derive(Debug)]
pub struct BuildIndexConfig {
  pub input: PathBuf,
  pub out_dir: PathBuf,
  pub model_path: PathBuf,
  pub tokenizer_path: PathBuf,
  pub ort_dylib_path: Option<PathBuf>,
  pub doc_max_length: usize,
}

#[derive(Debug, serde::Deserialize)]
struct CorpusLine {
  #[serde(rename = "docId")]
  doc_id: Option<String>,
  #[serde(rename = "mangaId")]
  manga_id: Option<i64>,
  title: Option<String>,
  text: Option<String>,
}

pub fn build_index(cfg: BuildIndexConfig) -> anyhow::Result<()> {
  fs::create_dir_all(&cfg.out_dir)?;

  let sqlite_path = cfg.out_dir.join("doc_meta.sqlite");
  let vectors_path = cfg.out_dir.join("vectors.f32");

  if sqlite_path.exists() {
    fs::remove_file(&sqlite_path)?;
  }
  if vectors_path.exists() {
    fs::remove_file(&vectors_path)?;
  }

  let mut embedder = BgeM3Embedder::new(
    &cfg.model_path,
    &cfg.tokenizer_path,
    cfg.ort_dylib_path.as_deref(),
  )?;

  let conn = Connection::open(&sqlite_path)?;
  conn.execute_batch(
    r#"
CREATE TABLE doc (
  doc_id TEXT PRIMARY KEY,
  manga_id INTEGER,
  title TEXT,
  text TEXT
);
CREATE TABLE vec_map (
  row INTEGER PRIMARY KEY,
  doc_id TEXT NOT NULL UNIQUE
);
"#,
  )?;

  let mut vec_writer = BufWriter::new(File::create(&vectors_path)?);

  let mut row: i64 = 0;
  for item in read_corpus(&cfg.input)? {
    let doc_id = item
      .doc_id
      .unwrap_or_else(|| format!("manga:{row}"));
    let manga_id = item.manga_id.unwrap_or(row);
    let title = item.title.unwrap_or_else(|| "(no title)".to_string());
    let text = item.text.unwrap_or_else(|| "".to_string());

    let emb = embedder.embed_dense_cls_normalized(&text, cfg.doc_max_length)?;

    conn.execute(
      "INSERT INTO doc (doc_id, manga_id, title, text) VALUES (?1, ?2, ?3, ?4)",
      params![doc_id, manga_id, title, text],
    )?;
    conn.execute(
      "INSERT INTO vec_map (row, doc_id) VALUES (?1, ?2)",
      params![row, doc_id],
    )?;

    let bytes: &[u8] = cast_slice(&emb);
    vec_writer.write_all(bytes)?;
    row += 1;
  }

  vec_writer.flush()?;

  Ok(())
}

fn read_corpus(input: &Path) -> anyhow::Result<Vec<CorpusLine>> {
  // JSONL first. If the first non-empty line isn't JSON, treat as plain text (single doc).
  let f = File::open(input)?;
  let mut reader = BufReader::new(f);

  let mut first_line = String::new();
  loop {
    first_line.clear();
    let n = reader.read_line(&mut first_line)?;
    if n == 0 {
      break;
    }
    if !first_line.trim().is_empty() {
      break;
    }
  }

  if first_line.trim().starts_with('{') {
    // JSONL mode
    let f = File::open(input)?;
    let reader = BufReader::new(f);
    let mut out = Vec::new();
    for line in reader.lines() {
      let line = line?;
      let line = line.trim();
      if line.is_empty() {
        continue;
      }
      let item: CorpusLine = serde_json::from_str(line)?;
      out.push(item);
    }
    return Ok(out);
  }

  // Plain text fallback: one doc containing the entire file.
  let mut s = String::new();
  File::open(input)?.read_to_string(&mut s)?;
  Ok(vec![CorpusLine {
    doc_id: Some("manga:summary".to_string()),
    manga_id: Some(0),
    title: Some("summary".to_string()),
    text: Some(s),
  }])
}

