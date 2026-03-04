use std::path::Path;

use ort::session::builder::GraphOptimizationLevel;
use ort::{inputs, session::Session, value::Tensor};
use tokenizers::Tokenizer;

pub struct BgeM3Embedder {
  tokenizer: Tokenizer,
  session: Session,
}

impl BgeM3Embedder {
  pub fn new(
    model_path: &Path,
    tokenizer_path: &Path,
    ort_dylib_path: Option<&Path>,
  ) -> anyhow::Result<Self> {
    if let Some(p) = ort_dylib_path {
      let ok = ort::init_from(p.to_string_lossy().as_ref())?.commit();
      if !ok {
        anyhow::bail!("failed to initialize onnxruntime from provided dylib path");
      }
    } else {
      // Best-effort init: works if ORT is discoverable.
      let ok = ort::init().commit();
      if !ok {
        anyhow::bail!("failed to initialize onnxruntime (ORT not discoverable?)");
      }
    }

    let tokenizer = Tokenizer::from_file(tokenizer_path)
      .map_err(|e| anyhow::anyhow!("failed to load tokenizer: {e}"))?;

    let session = Session::builder()?
      .with_optimization_level(GraphOptimizationLevel::Level3)?
      .commit_from_file(model_path)
      .map_err(|e| anyhow::anyhow!("failed to load onnx: {e}"))?;

    Ok(Self { tokenizer, session })
  }

  pub fn embed_dense_cls(&mut self, text: &str, max_length: usize) -> anyhow::Result<Vec<f32>> {
    let enc = self
      .tokenizer
      .encode(text, true)
      .map_err(|e| anyhow::anyhow!("tokenize failed: {e}"))?;

    let mut ids: Vec<i64> = enc.get_ids().iter().map(|&v| v as i64).collect();
    let mut mask: Vec<i64> = enc
      .get_attention_mask()
      .iter()
      .map(|&v| v as i64)
      .collect();
    let mut type_ids: Vec<i64> = enc
      .get_type_ids()
      .iter()
      .map(|&v| v as i64)
      .collect();

    if ids.len() > max_length {
      ids.truncate(max_length);
      mask.truncate(max_length);
      type_ids.truncate(max_length);
    }

    let seq = ids.len().max(1);
    if ids.is_empty() {
      // Safety: shouldn't happen, but keep shapes valid.
      ids.push(0);
      mask.push(0);
      type_ids.push(0);
    }

    let input_ids = Tensor::from_array(([1usize, seq], ids))?;
    let attention_mask = Tensor::from_array(([1usize, seq], mask))?;
    let token_type_ids = Tensor::from_array(([1usize, seq], type_ids))?;

    let outputs = self.session.run(inputs![
      "input_ids" => input_ids,
      "attention_mask" => attention_mask,
      "token_type_ids" => token_type_ids
    ])?;

    let (_shape, data) = outputs[0].try_extract_tensor::<f32>()?;
    if data.len() < 1024 {
      anyhow::bail!("unexpected output size: {}", data.len());
    }

    Ok(data[0..1024].to_vec())
  }

  pub fn embed_dense_cls_normalized(&mut self, text: &str, max_length: usize) -> anyhow::Result<Vec<f32>> {
    let mut v = self.embed_dense_cls(text, max_length)?;
    l2_normalize_in_place(&mut v);
    Ok(v)
  }
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

