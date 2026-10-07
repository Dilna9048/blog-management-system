import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://127.0.0.1:8000/api/'; 

function App() {
  const [posts, setPosts] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  
  // Forms
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ username: '', password: '', email: '' });
  const [blogForm, setBlogForm] = useState({ title: '', content: '' });
  const [editingPostId, setEditingPostId] = useState(null);
  const [commentText, setCommentText] = useState({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}posts/`);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        const res = await axios.post(`${API_URL}login/`, {
          username: authForm.username,
          password: authForm.password
        });
        localStorage.setItem('token', res.data.access);
        localStorage.setItem('username', authForm.username);
        setToken(res.data.access);
        setUsername(authForm.username);
      } else {
        await axios.post(`${API_URL}register/`, authForm);
        alert('Registration successful! Please login.');
        setAuthMode('login');
      }
    } catch (err) {
      alert('Authentication Failed! Check your inputs.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken('');
    setUsername('');
  };

  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      if (editingPostId) {
        await axios.put(`${API_URL}posts/${editingPostId}/`, blogForm, config);
        setEditingPostId(null);
      } else {
        await axios.post(`${API_URL}posts/`, blogForm, config);
      }
      setBlogForm({ title: '', content: '' });
      fetchPosts();
    } catch (err) {
      alert('Error saving post. Make sure you are the author.');
    }
  };

  const handleEdit = (post) => {
    setEditingPostId(post.id);
    setBlogForm({ title: post.title, content: post.content });
  };

  const handleDelete = async (id) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.delete(`${API_URL}posts/${id}/`, config);
      fetchPosts();
    } catch (err) {
      alert('Delete failed. Unauthorized.');
    }
  };

  const handleAddComment = async (postId) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.post(`${API_URL}comments/`, { post: postId, text: commentText[postId] }, config);
      setCommentText({ ...commentText, [postId]: '' });
      fetchPosts();
    } catch (err) {
      alert('Failed to add comment. Please login.');
    }
  };

  return (
    <div className="App" style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>📝 Blog Management System</h1>

      {/* Auth Section */}
      {!token ? (
        <div className="auth-container">
          <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
          <form onSubmit={handleAuthSubmit}>
            <input type="text" placeholder="Username" required onChange={e => setAuthForm({...authForm, username: e.target.value})} /><br/><br/>
            {authMode === 'register' && (
              <>
                <input type="email" placeholder="Email" required onChange={e => setAuthForm({...authForm, email: e.target.value})} /><br/><br/>
              </>
            )}
            <input type="password" placeholder="Password" required onChange={e => setAuthForm({...authForm, password: e.target.value})} /><br/><br/>
            <button type="submit">{authMode === 'login' ? 'Login' : 'Register'}</button>
          </form>
          <p onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{cursor:'pointer', color:'blue'}}>
            {authMode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
          </p>
        </div>
      ) : (
        <div>
          <p>Welcome, <strong>{username}</strong>! <button onClick={handleLogout}>Logout</button></p>
          
          
          <h2>{editingPostId ? 'Edit Post' : 'Create a New Blog Post'}</h2>
          <form onSubmit={handleBlogSubmit}>
            <input type="text" placeholder="Title" value={blogForm.title} required onChange={e => setBlogForm({...blogForm, title: e.target.value})} style={{width:'300px'}}/><br/><br/>
            <textarea placeholder="Content" value={blogForm.content} required onChange={e => setBlogForm({...blogForm, content: e.target.value})} style={{width:'300px', height:'100px'}}/><br/><br/>
            <button type="submit">{editingPostId ? 'Update Post' : 'Publish Post'}</button>
            {editingPostId && <button onClick={() => { setEditingPostId(null); setBlogForm({title:'', content:''}); }}>Cancel</button>}
          </form>
        </div>
      )}

      
      <h2>All Blog Posts</h2>
      {posts.map(post => (
        <div key={post.id} style={{ border: '1px solid #ccc', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
          <h3>{post.title}</h3>
          <p style={{ color: '#555' }}>By: <em>{post.author}</em></p>
          <p>{post.content}</p>
          
          {username === post.author && (
            <div>
              <button onClick={() => handleEdit(post)}>Edit</button>
              <button onClick={() => handleDelete(post.id)} style={{marginLeft:'10px', color:'red'}}>Delete</button>
            </div>
          )}

          {/* Comments Section */}
          <h4>Comments:</h4>
          {post.comments && post.comments.map(c => (
            <p key={c.id} style={{ backgroundColor: '#f9f9f9', padding: '5px' }}>
              <strong>{c.author}:</strong> {c.text}
            </p>
          ))}
          
          {token && (
            <div>
              <input 
                type="text" 
                placeholder="Write a comment..." 
                value={commentText[post.id] || ''} 
                onChange={e => setCommentText({...commentText, [post.id]: e.target.value})}
              />
              <button onClick={() => handleAddComment(post.id)}>Comment</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;
