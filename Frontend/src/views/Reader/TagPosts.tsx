import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import "./TagPosts.css";

const BASE_API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

interface Post {
    id: number;
    title: string;
    content: string;
    tag: string;
    image_url: string | null;
    video_url: string | null;
    date_created: string;
    author: string;
    profile_pic: string | null;
}

interface TagPostsProps {
    user: any;
    isAuthenticated: boolean;
    authChecked: boolean;
    handleLoginSuccess: (userData: any) => void;
    handleLogout: () => void;
}

const TagPosts: React.FC<TagPostsProps> = ({
    user,
    isAuthenticated,
    authChecked,
    handleLoginSuccess,
    handleLogout
}) => {
    const { tag } = useParams<{ tag: string }>();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPostsByTag = async () => {
            try {
                const response = await axios.get(`${BASE_API_URL}/api/posts/tag/${tag}`);
                setPosts(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch posts');
                setLoading(false);
                console.error('Error fetching posts by tag:', err);
            }
        };

        fetchPostsByTag();
    }, [tag]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="tag-posts-container">
            <h1>Posts tagged with: {tag}</h1>
            <div className="posts-grid">
                {posts.map(post => (
                    <div key={post.id} className="post-card">
                        {post.image_url && (
                            <img src={post.image_url} alt={post.title} className="post-image" />
                        )}
                        {post.video_url && (
                            <video controls className="post-video">
                                <source src={post.video_url} type="video/mp4" />
                            </video>
                        )}
                        <h2>{post.title}</h2>
                        <p>{post.content}</p>
                        <div className="post-meta">
                            <span className="post-author">
                                {post.profile_pic && (
                                    <img src={post.profile_pic} alt={post.author} className="author-avatar" />
                                )}
                                {post.author}
                            </span>
                            <span className="post-date">
                                {new Date(post.date_created).toLocaleDateString()}
                            </span>
                        </div>
                        <Link to={`/archive/${post.id}`} className="view-post-btn">
                            View Post
                        </Link>
                    </div>
                ))}
            </div>
            <Link to="/archive" className="back-to-archive">
                Back to Archive
            </Link>
        </div>
    );
};

export default TagPosts;
