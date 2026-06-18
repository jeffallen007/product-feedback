class MissingSupabaseConfigError(RuntimeError):
    """Raised when required Supabase environment variables are not configured."""


class SupabaseInsertError(RuntimeError):
    """Raised when a Supabase insert request fails."""
