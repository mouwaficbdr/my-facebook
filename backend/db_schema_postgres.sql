-- Schéma PostgreSQL pour MyFacebook (Migration depuis MySQL)
-- Compatible avec Supabase
-- Conversion : AUTO_INCREMENT → SERIAL/BIGSERIAL, TINYINT → BOOLEAN, DATETIME → TIMESTAMP

-- Extension pour UUID si nécessaire (optionnel)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table structure for table "users"
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  prenom VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  genre VARCHAR(10) NOT NULL CHECK (genre IN ('Homme', 'Femme', 'Autre')),
  date_naissance DATE NOT NULL,
  email_confirm_token VARCHAR(64) DEFAULT NULL,
  email_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  date_inscription TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  reset_password_token VARCHAR(64) DEFAULT NULL,
  reset_token_expiry TIMESTAMP DEFAULT NULL,
  photo_profil VARCHAR(255) DEFAULT NULL,
  cover_url VARCHAR(255) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  ville VARCHAR(100) DEFAULT NULL,
  pays VARCHAR(100) DEFAULT NULL
);

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table structure for table "posts"
DROP TABLE IF EXISTS posts CASCADE;
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  contenu TEXT NOT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  type VARCHAR(10) NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'video')),
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT posts_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);
CREATE INDEX idx_posts_created_at ON posts(created_at);

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table structure for table "comments"
DROP TABLE IF EXISTS comments CASCADE;
CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  contenu TEXT NOT NULL,
  parent_id BIGINT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT comments_post_fk FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT comments_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT comments_parent_fk FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table structure for table "likes"
DROP TABLE IF EXISTS likes CASCADE;
CREATE TABLE likes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  post_id BIGINT NOT NULL,
  type VARCHAR(10) NOT NULL DEFAULT 'like' CHECK (type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT likes_user_post_unique UNIQUE (user_id, post_id),
  CONSTRAINT likes_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT likes_post_fk FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- Table structure for table "comment_likes"
DROP TABLE IF EXISTS comment_likes CASCADE;
CREATE TABLE comment_likes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  comment_id BIGINT NOT NULL,
  type VARCHAR(10) NOT NULL DEFAULT 'like' CHECK (type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT comment_likes_user_comment_unique UNIQUE (user_id, comment_id),
  CONSTRAINT comment_likes_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT comment_likes_comment_fk FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- Table structure for table "friendships"
DROP TABLE IF EXISTS friendships CASCADE;
CREATE TABLE friendships (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  friend_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT friendships_unique UNIQUE (user_id, friend_id),
  CONSTRAINT friendships_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT friendships_friend_fk FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_friendships_user_status ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend_status ON friendships(friend_id, status);
CREATE INDEX idx_friendships_created_at ON friendships(created_at);

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table structure for table "messages"
DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT NOT NULL,
  contenu TEXT NOT NULL,
  type VARCHAR(10) NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT messages_sender_fk FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT messages_receiver_fk FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, created_at);
CREATE INDEX idx_messages_receiver_unread ON messages(receiver_id, is_read);

-- Table structure for table "notifications"
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  from_user_id BIGINT DEFAULT NULL,
  type VARCHAR(32) NOT NULL CHECK (type IN ('friend_request', 'like', 'comment', 'mention', 'system')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT notifications_from_user_fk FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_from_user_id ON notifications(from_user_id);

-- Table structure for table "stories"
DROP TABLE IF EXISTS stories CASCADE;
CREATE TABLE stories (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  image VARCHAR(255) NOT NULL,
  legend VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT stories_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_stories_user_id ON stories(user_id);

-- Table structure for table "story_views"
DROP TABLE IF EXISTS story_views CASCADE;
CREATE TABLE story_views (
  id BIGSERIAL PRIMARY KEY,
  story_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT story_views_unique UNIQUE (story_id, user_id),
  CONSTRAINT story_views_story_fk FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT story_views_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_user_id ON story_views(user_id);

-- Table structure for table "saved_posts"
DROP TABLE IF EXISTS saved_posts CASCADE;
CREATE TABLE saved_posts (
  user_id BIGINT NOT NULL,
  post_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  CONSTRAINT saved_posts_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT saved_posts_post_fk FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX idx_saved_posts_post_id ON saved_posts(post_id);

-- Table structure for table "deleted_posts" (Back office)
DROP TABLE IF EXISTS deleted_posts CASCADE;
CREATE TABLE deleted_posts (
  id BIGSERIAL PRIMARY KEY,
  original_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  contenu TEXT DEFAULT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  type VARCHAR(10) DEFAULT 'text' CHECK (type IN ('text', 'image', 'video')),
  is_public BOOLEAN DEFAULT TRUE,
  original_created_at TIMESTAMP DEFAULT NULL,
  deleted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_by BIGINT NOT NULL,
  reason VARCHAR(255) DEFAULT NULL,
  CONSTRAINT deleted_posts_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT deleted_posts_deleted_by_fk FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_deleted_posts_original_id ON deleted_posts(original_id);
CREATE INDEX idx_deleted_posts_user_id ON deleted_posts(user_id);
CREATE INDEX idx_deleted_posts_deleted_by ON deleted_posts(deleted_by);
CREATE INDEX idx_deleted_posts_deleted_at ON deleted_posts(deleted_at);

-- Table structure for table "moderation_logs"
DROP TABLE IF EXISTS moderation_logs CASCADE;
CREATE TABLE moderation_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id BIGINT NOT NULL,
  action_type VARCHAR(32) NOT NULL CHECK (action_type IN ('delete_post', 'delete_comment', 'ban_user', 'unban_user', 'change_role', 'other')),
  target_id BIGINT NOT NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
  details JSONB DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT moderation_logs_admin_fk FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_moderation_logs_admin_id ON moderation_logs(admin_id);
CREATE INDEX idx_moderation_logs_action_type ON moderation_logs(action_type);
CREATE INDEX idx_moderation_logs_target ON moderation_logs(target_type, target_id);
CREATE INDEX idx_moderation_logs_created_at ON moderation_logs(created_at);

-- Table structure for table "activity_stats" (Dashboard)
DROP TABLE IF EXISTS activity_stats CASCADE;
CREATE TABLE activity_stats (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  new_users INT NOT NULL DEFAULT 0,
  new_posts INT NOT NULL DEFAULT 0,
  new_comments INT NOT NULL DEFAULT 0,
  new_likes INT NOT NULL DEFAULT 0,
  deleted_posts INT NOT NULL DEFAULT 0,
  deleted_comments INT NOT NULL DEFAULT 0,
  active_users INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_activity_stats_date ON activity_stats(date);

-- Commentaires et notes
COMMENT ON TABLE users IS 'Table des utilisateurs avec authentification et profil';
COMMENT ON TABLE posts IS 'Posts/publications des utilisateurs';
COMMENT ON TABLE friendships IS 'Relations d''amitié entre utilisateurs (user_id = demandeur, friend_id = destinataire)';
COMMENT ON TABLE notifications IS 'Système de notifications temps réel';
COMMENT ON TABLE activity_stats IS 'Statistiques agrégées pour le dashboard admin';

-- Fin du schéma Postgres
