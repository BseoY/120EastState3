import React, { useState, useEffect } from "react";
import "../styles/carousel.css";

export default function Carousel({ posts = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [postsPerPage, setPostsPerPage] = useState(getPostsPerPage());
  function getPostsPerPage() {
    if (window.innerWidth > 600) return 3; // Desktop: Show 3 items
    return 1; // Mobile: Show 1 item
  }

  useEffect(() => {
    const handleResize = () => {
      setPostsPerPage(getPostsPerPage());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalSlides = Math.ceil(posts.length / postsPerPage);

  const nextPost = () => {
    if (currentIndex >= posts.length - 1) 
      setCurrentIndex(-1);
    console.log(currentIndex);
    setCurrentIndex((prevIndex) => (prevIndex + 1));
  };

  const prevPost = () => {
    if (currentIndex <= 0) 
      setCurrentIndex(posts.length);
    console.log(currentIndex);
    setCurrentIndex((prevIndex) => (prevIndex - 1));
  };

  return (
    <>
      <div className="carousel">
        <div className="carousel-wrapper">
            <div
              className="carousel-track"
              style={{
                transform: `translateX(-${currentIndex * (100 / postsPerPage)}%)`,
              }}
            >
            {posts.slice(0, 6).map((post, index) => (
              <div className="carousel-slide" key={index}>
                <div>
                  <div>
                    <p id="post-title">{post.title}</p>
                    <p id="post-author">Created by: {post.author}</p>
                    <p id="post-date">
                      {post.date_created ? new Date(post.date_created).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Unknown date'}
                    </p>
                  </div>
                  <hr></hr>
                  <div>
                  <img src={post.image_url} className="fit_image" alt={post.image_url} />
                  <p>{post.content}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="carousel-slide" id="end-slide">
              <p>View the full archive below!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="footer">
        <div>
          <button className="prev" onClick={prevPost}>
            &#x2190;
          </button>
          <button className="next" onClick={nextPost}>
            &#x2192;
          </button>
        </div>
      </div>
    </>
  );
}
