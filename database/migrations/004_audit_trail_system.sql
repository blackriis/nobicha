-- Create audit action enum
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'CALCULATE');

-- Create audit_logs table for compliance and security monitoring
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action audit_action NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- RLS Policy - Only allow inserts (no updates/deletes to preserve audit integrity)
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);