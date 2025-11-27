import { createClient } from "@supabase/supabase-js";
import 'react-native-url-polyfill/auto';

const SUPABASE_URL = "https://ecrxprpogmtetlxwhnzr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcnhwcnBvZ210ZXRseHdobnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTA2MDQsImV4cCI6MjA3OTc2NjYwNH0.Oyz6SGK8YwzTr6VFJlGGYsLrAOo8YDPMKcy2CBYTs6E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

