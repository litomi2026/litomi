import { performance } from 'perf_hooks'

export interface PerformanceResult {
  durations: number[]
  iterations: number
  memory?: {
    heapUsedBefore: number
    heapUsedAfter: number
    heapDelta: number
    externalBefore: number
    externalAfter: number
    externalDelta: number
  }
  metrics: {
    min: number
    max: number
    mean: number
    median: number
    p50: number
    p90: number
    p95: number
    p99: number
    stdDev: number
  }
  operation: string
  timestamp: Date
}

export class PerformanceMetrics {
  private ongoingMeasurements: Map<string, { startTime: number; startMemory: NodeJS.MemoryUsage }> = new Map()
  private results: Map<string, PerformanceResult> = new Map()

  /**
   * Compare two operations
   */
  compare(operation1: string, operation2: string): string {
    const result1 = this.getResult(operation1)
    const result2 = this.getResult(operation2)

    if (!result1 || !result2) {
      return 'Cannot compare: one or both operations not found'
    }

    const faster = result1.metrics.median < result2.metrics.median ? operation1 : operation2
    const slower = faster === operation1 ? operation2 : operation1
    const speedup =
      (Math.abs(result1.metrics.median - result2.metrics.median) /
        Math.max(result1.metrics.median, result2.metrics.median)) *
      100

    let report = '\n' + '='.repeat(60) + '\n'
    report += ' PERFORMANCE COMPARISON\n'
    report += '='.repeat(60) + '\n\n'
    report += `${faster} is ${speedup.toFixed(1)}% faster than ${slower}\n\n`
    report += `${operation1}: Median ${this.formatDuration(result1.metrics.median)}, P95 ${this.formatDuration(result1.metrics.p95)}\n`
    report += `${operation2}: Median ${this.formatDuration(result2.metrics.median)}, P95 ${this.formatDuration(result2.metrics.p95)}\n`
    report += '\n' + '='.repeat(60) + '\n'

    return report
  }

  /**
   * End measurement and record the result
   */
  endMeasure(operation: string): number {
    const measurement = this.ongoingMeasurements.get(operation)
    if (!measurement) {
      throw new Error(`No ongoing measurement for operation: ${operation}`)
    }

    const endTime = performance.now()
    const endMemory = process.memoryUsage()
    const duration = endTime - measurement.startTime

    // Get or create result entry
    let result = this.results.get(operation)
    if (!result) {
      result = {
        operation,
        iterations: 0,
        durations: [],
        metrics: this.calculateMetrics([]),
        memory: {
          heapUsedBefore: measurement.startMemory.heapUsed,
          heapUsedAfter: endMemory.heapUsed,
          heapDelta: endMemory.heapUsed - measurement.startMemory.heapUsed,
          externalBefore: measurement.startMemory.external,
          externalAfter: endMemory.external,
          externalDelta: endMemory.external - measurement.startMemory.external,
        },
        timestamp: new Date(),
      }
      this.results.set(operation, result)
    }

    // Add duration and update metrics
    result.durations.push(duration)
    result.iterations++
    result.metrics = this.calculateMetrics(result.durations)

    this.ongoingMeasurements.delete(operation)
    return duration
  }

  /**
   * Export results to file
   */
  async exportToFile(filepath: string): Promise<void> {
    const fs = await import('fs/promises')
    const report = this.generateReport({ format: 'json' })
    await fs.writeFile(filepath, report, 'utf-8')
    console.log(`Performance results exported to ${filepath}`)
  }

  /**
   * Generate a performance report
   */
  generateReport(options: { format?: 'console' | 'json' | 'markdown' } = {}): string {
    const { format = 'console' } = options
    const results = this.getAllResults()

    if (results.length === 0) {
      return 'No performance measurements recorded'
    }

    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2)

      case 'markdown':
        return this.generateMarkdownReport(results)

      case 'console':
      default:
        return this.generateConsoleReport(results)
    }
  }

  /**
   * Get all results
   */
  getAllResults(): PerformanceResult[] {
    return Array.from(this.results.values())
  }

  /**
   * Get results for a specific operation
   */
  getResult(operation: string): PerformanceResult | undefined {
    return this.results.get(operation)
  }

  /**
   * Measure an async operation
   */
  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasure(operation)
    try {
      const result = await fn()
      this.endMeasure(operation)
      return result
    } catch (error) {
      this.endMeasure(operation)
      throw error
    }
  }

  /**
   * Measure multiple iterations of an operation
   */
  async measureIterations<T>(
    operation: string,
    iterations: number,
    fn: () => Promise<T>,
    options: { warmup?: number; delayMs?: number } = {},
  ): Promise<void> {
    const { warmup = 0, delayMs = 0 } = options

    // Warmup runs
    if (warmup > 0) {
      console.log(`Warming up ${operation} with ${warmup} iterations...`)
      for (let i = 0; i < warmup; i++) {
        await fn()
      }
    }

    // Actual measurements
    console.log(`Measuring ${operation} with ${iterations} iterations...`)
    for (let i = 0; i < iterations; i++) {
      await this.measure(`${operation}`, fn)

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }

      // Progress logging
      if ((i + 1) % Math.max(1, Math.floor(iterations / 10)) === 0) {
        console.log(`  Progress: ${i + 1}/${iterations} iterations`)
      }
    }
  }

  /**
   * Reset all measurements
   */
  reset(): void {
    this.results.clear()
    this.ongoingMeasurements.clear()
  }

  /**
   * Start measuring performance for an operation
   */
  startMeasure(operation: string): void {
    const startTime = performance.now()
    const startMemory = process.memoryUsage()

    this.ongoingMeasurements.set(operation, { startTime, startMemory })
  }

  /**
   * Calculate statistical metrics from durations
   */
  private calculateMetrics(durations: number[]): PerformanceResult['metrics'] {
    if (durations.length === 0) {
      return {
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        stdDev: 0,
      }
    }

    const sorted = [...durations].sort((a, b) => a - b)
    const sum = sorted.reduce((acc, val) => acc + val, 0)
    const mean = sum / sorted.length

    // Calculate standard deviation
    const squaredDiffs = sorted.map((val) => Math.pow(val - mean, 2))
    const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / sorted.length
    const stdDev = Math.sqrt(avgSquaredDiff)

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean,
      median: this.percentile(sorted, 50),
      p50: this.percentile(sorted, 50),
      p90: this.percentile(sorted, 90),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      stdDev,
    }
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    if (ms < 1) return `${(ms * 1000).toFixed(2)}µs`
    if (ms < 1000) return `${ms.toFixed(2)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  /**
   * Format memory size in human-readable format
   */
  private formatMemory(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = Math.abs(bytes)
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    const sign = bytes < 0 ? '-' : '+'
    return `${sign}${size.toFixed(2)} ${units[unitIndex]}`
  }

  /**
   * Generate console-formatted report
   */
  private generateConsoleReport(results: PerformanceResult[]): string {
    let report = '\n' + '='.repeat(40) + '\n'
    report += ' PERFORMANCE TEST RESULTS\n'
    report += '-'.repeat(40) + '\n'

    for (const result of results) {
      report += `${result.operation}\n`
      report += `Iterations: ${result.iterations}\n`
      report += `\nResponse Times:\n`
      report += `  Min:    ${this.formatDuration(result.metrics.min)}\n`
      report += `  Max:    ${this.formatDuration(result.metrics.max)}\n`
      report += `  Mean:   ${this.formatDuration(result.metrics.mean)}\n`
      report += `  Median: ${this.formatDuration(result.metrics.median)}\n`
      report += `  P90:    ${this.formatDuration(result.metrics.p90)}\n`
      report += `  P95:    ${this.formatDuration(result.metrics.p95)}\n`
      report += `  P99:    ${this.formatDuration(result.metrics.p99)}\n`
      report += `  StdDev: ${this.formatDuration(result.metrics.stdDev)}\n`

      if (result.memory) {
        report += `\nMemory Usage:\n`
        report += `  Heap Delta:     ${this.formatMemory(result.memory.heapDelta)}\n`
        report += `  External Delta: ${this.formatMemory(result.memory.externalDelta)}\n`
      }
    }

    report += '='.repeat(40) + '\n'
    return report
  }

  /**
   * Generate Markdown-formatted report
   */
  private generateMarkdownReport(results: PerformanceResult[]): string {
    let report = '# Performance Test Results\n\n'
    report += `Generated: ${new Date().toISOString()}\n\n`

    for (const result of results) {
      report += `## ${result.operation}\n\n`
      report += `- **Iterations:** ${result.iterations}\n`
      report += `- **Timestamp:** ${result.timestamp.toISOString()}\n\n`

      report += '### Response Times\n\n'
      report += '| Metric | Value |\n'
      report += '|--------|-------|\n'
      report += `| Min | ${this.formatDuration(result.metrics.min)} |\n`
      report += `| Max | ${this.formatDuration(result.metrics.max)} |\n`
      report += `| Mean | ${this.formatDuration(result.metrics.mean)} |\n`
      report += `| Median | ${this.formatDuration(result.metrics.median)} |\n`
      report += `| P90 | ${this.formatDuration(result.metrics.p90)} |\n`
      report += `| P95 | ${this.formatDuration(result.metrics.p95)} |\n`
      report += `| P99 | ${this.formatDuration(result.metrics.p99)} |\n`
      report += `| StdDev | ${this.formatDuration(result.metrics.stdDev)} |\n\n`

      if (result.memory) {
        report += '### Memory Usage\n\n'
        report += '| Metric | Value |\n'
        report += '|--------|-------|\n'
        report += `| Heap Delta | ${this.formatMemory(result.memory.heapDelta)} |\n`
        report += `| External Delta | ${this.formatMemory(result.memory.externalDelta)} |\n\n`
      }
    }

    return report
  }

  /**
   * Calculate percentile value
   */
  private percentile(sorted: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }
}
