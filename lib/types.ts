export type Member = {
  id: string;
  display_name: string;
  group_name: string;
  avatar_path: string | null;
  sort_order: number;
};

export type Folder = {
  id: string;
  member_id: string;
  parent_id: string | null;
  name: string;
};

export type Doc = {
  id: string;
  folder_id: string | null;
  title: string;
  file_path: string;
  mime_type: string | null;
  expires_on: string | null;
  created_at: string;
};
