import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ldvvoojabzcbdpeozgbh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkdnZvb2phYnpjYmRwZW96Z2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjU5MDAsImV4cCI6MjA4NzYwMTkwMH0._YYfSWOtdcuFxvT-UcLPDS1upTZYqkKHthtKjKWZ9Lc";

export const supabase = createClient(supabaseUrl, supabaseKey);