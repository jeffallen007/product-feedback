alter table data_sources
drop constraint if exists data_sources_source_type_check;

alter table data_sources
add constraint data_sources_source_type_check
check (source_type in ('review', 'demo_dataset', 'csv_upload', 'pasted_text', 'x_search'));

alter table feedback_items
drop constraint if exists feedback_items_source_type_check;

alter table feedback_items
add constraint feedback_items_source_type_check
check (source_type in ('review', 'demo_dataset', 'csv_upload', 'pasted_text', 'x_search'));

alter table chat_messages
drop constraint if exists chat_messages_scope_check;

alter table chat_messages
add constraint chat_messages_scope_check
check (scope in ('all', 'review', 'demo_dataset', 'csv_upload', 'pasted_text', 'x_search'));
