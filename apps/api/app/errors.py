class MissingSupabaseConfigError(RuntimeError):
    """Raised when required Supabase environment variables are not configured."""


class SupabaseInsertError(RuntimeError):
    """Raised when a Supabase insert request fails."""


class InvalidDemoProductError(ValueError):
    """Raised when a requested demo product does not exist."""


class FeedbackSetNotFoundError(LookupError):
    """Raised when a feedback set does not exist."""


class EmptyFeedbackSetError(ValueError):
    """Raised when a feedback set cannot be synthesized because it has no data."""


class AnalysisRunNotFoundError(LookupError):
    """Raised when an analysis run does not exist."""


class InvalidPastedFeedbackError(ValueError):
    """Raised when pasted feedback input is empty or invalid."""


class InvalidCsvUploadError(ValueError):
    """Raised when an uploaded CSV file is empty, malformed, or unsupported."""
