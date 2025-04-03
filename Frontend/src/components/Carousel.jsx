import React, { useState, useEffect } from "react";
import "../styles/carousel.css"
export default function Carousel({posts = [], loading, error}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [postsPerPage, setPostsPerPage] = useState(getPostsPerPage());

  function getPostsPerPage() {
    if (window.innerWidth > 1000) return 3; // Desktop: Show 3 items
    return 1;  // Mobile: Show 1 item
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
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
  }

  const prevPost = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides);
  }

  return (
    <>
    <div className="header">
      <strong className="">Recent Posts</strong>
      <div>
        <button className="prev" onClick={prevPost}>&#x2190;</button>
        <button className="next" onClick={nextPost}>&#x2192;</button>
      </div>
    </div>

    <div className="carousel">
      <div className="carousel-wrapper">
      <div className="carousel-track" style={{ transform: `translateX(-${currentIndex * (100 / postsPerPage)}%)` }}>
          { posts.slice(0, 5).map((post) => (
          <div className="carousel-slide">
            <div className="">
              <div>
                <p>{post.author}</p>
                <hr></hr>
              </div>
              <img src={post.image_url} className="fit_image"></img>
              <strong>{post.title}</strong>
              <p>{post.content}</p>
            </div>
          </div>
          ))}
        </div>
      </div>
    </div>

    </>
  )
}
