type BaseSentryInitOptions = {
  beforeBreadcrumb: (breadcrumb: Breadcrumb) => Breadcrumb | null
  beforeSend: (event: ErrorEvent) => ErrorEvent | null
  dsn?: string
  enabled: boolean
  environment?: string
  initialScope: {
    tags: {
      service: string
    }
  }
  release?: string
  sendDefaultPii: true
}

type SharedSentryOptions = {
  dsn?: string
  environment?: string
  release?: string
  service: string
}

export function createSentryInitOptions({
  dsn,
  environment,
  release,
  service,
}: SharedSentryOptions): BaseSentryInitOptions {
  return {
    dsn,
    enabled: Boolean(dsn),
    environment,
    release,
    sendDefaultPii: true,
    beforeSend: scrubSentryEvent,
    beforeBreadcrumb: sanitizeBreadcrumb,
    initialScope: { tags: { service } },
  }
}

