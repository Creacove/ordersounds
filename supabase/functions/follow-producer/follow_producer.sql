
-- SQL function to allow producers to follow other producers
CREATE OR REPLACE FUNCTION follow_producer(
  p_follower_id UUID,
  p_followee_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Delete the follower-followee relationship if it exists (to avoid duplicates)
  DELETE FROM followers
  WHERE follower_id = p_follower_id AND followee_id = p_followee_id;
  
  -- Insert the new follower-followee relationship
  INSERT INTO followers (follower_id, followee_id)
  VALUES (p_follower_id, p_followee_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
