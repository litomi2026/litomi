use std::{cmp::Reverse, path::Path};

use memmap2::Mmap;
use ordered_float::NotNan;

pub struct VectorStore {
  mmap: Mmap,
  dims: usize,
  vectors: &'static [f32],
}

impl VectorStore {
  pub fn open(path: &Path, dims: usize) -> anyhow::Result<Self> {
    let f = std::fs::File::open(path)?;
    let mmap = unsafe { Mmap::map(&f)? };
    let vectors: &[f32] = bytemuck::try_cast_slice(&mmap)
      .map_err(|e| anyhow::anyhow!("invalid vectors.f32 format: {e}"))?;

    if dims == 0 {
      anyhow::bail!("dims must be > 0");
    }
    if vectors.len() % dims != 0 {
      anyhow::bail!(
        "vectors.f32 length {} is not divisible by dims {}",
        vectors.len(),
        dims
      );
    }

    // Safety: mmap lives inside Self; we transmute the slice to 'static so we can
    // keep it as a field without self-referential borrows. Access is still bounded
    // by `self` methods.
    let vectors_static: &'static [f32] =
      unsafe { std::mem::transmute::<&[f32], &'static [f32]>(vectors) };

    Ok(Self {
      mmap,
      dims,
      vectors: vectors_static,
    })
  }

  pub fn dims(&self) -> usize {
    self.dims
  }

  pub fn len(&self) -> usize {
    self.vectors.len() / self.dims
  }

  pub fn search_top_k(&self, q: &[f32], top_k: usize) -> anyhow::Result<Vec<(usize, f32)>> {
    if q.len() != self.dims {
      anyhow::bail!("query dims mismatch: got {}, expected {}", q.len(), self.dims);
    }

    let k = top_k.min(self.len()).max(1);
    let mut heap: std::collections::BinaryHeap<(Reverse<NotNan<f32>>, usize)> =
      std::collections::BinaryHeap::new();

    for i in 0..self.len() {
      let start = i * self.dims;
      let v = &self.vectors[start..start + self.dims];
      let mut score = 0.0_f32;
      for (a, b) in q.iter().zip(v.iter()) {
        score += a * b;
      }

      // We L2-normalize both sides, so score should be finite.
      let Ok(nn) = NotNan::new(score) else {
        continue;
      };

      if heap.len() < k {
        heap.push((Reverse(nn), i));
        continue;
      }

      // BinaryHeap is max-heap; Reverse turns it into min-heap by score.
      if let Some((Reverse(worst), _)) = heap.peek() {
        if nn > *worst {
          let _ = heap.pop();
          heap.push((Reverse(nn), i));
        }
      }
    }

    let mut out: Vec<(usize, f32)> = heap
      .into_iter()
      .map(|(Reverse(score), idx)| (idx, score.into_inner()))
      .collect();
    out.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    Ok(out)
  }
}

