"""
Blog / Featured Activities Routes.
Public endpoints for reading activities; Admin endpoints for CRUD management.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.all_models import BlogPost, User
from backend.app.schemas.schemas import (
    BlogPostCreate,
    BlogPostUpdate,
    BlogPostResponse
)
from backend.app.services.auth_service import require_admin

router = APIRouter(prefix="/blogs", tags=["Featured Activities & Blogs"])


# ─── PUBLIC: LIST PUBLISHED BLOGS ────────────────────────────────────
@router.get("", response_model=List[BlogPostResponse])
def get_published_blogs(
    category: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    query = db.query(BlogPost).filter(BlogPost.is_published == True)
    if category and category.lower() != "all":
        query = query.filter(BlogPost.category == category)
    return query.order_by(BlogPost.created_at.desc()).limit(limit).all()


# ─── PUBLIC: GET SINGLE BLOG ─────────────────────────────────────────
@router.get("/{blog_id}", response_model=BlogPostResponse)
def get_blog(blog_id: int, db: Session = Depends(get_db)):
    blog = db.query(BlogPost).filter(BlogPost.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found.")
    return blog


# ─── ADMIN: GET ALL BLOGS (INCLUDING DRAFTS) ────────────────────────
@router.get("/admin/all", response_model=List[BlogPostResponse])
def get_all_blogs_admin(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    return db.query(BlogPost).order_by(BlogPost.created_at.desc()).all()


# ─── ADMIN: CREATE BLOG ──────────────────────────────────────────────
@router.post("", response_model=BlogPostResponse, status_code=status.HTTP_201_CREATED)
def create_blog(
    blog_in: BlogPostCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    blog = BlogPost(
        title=blog_in.title,
        title_hi=blog_in.title_hi,
        summary=blog_in.summary,
        summary_hi=blog_in.summary_hi,
        content=blog_in.content,
        content_hi=blog_in.content_hi,
        image_url=blog_in.image_url,
        category=blog_in.category,
        is_published=blog_in.is_published,
        author_id=admin.id
    )
    db.add(blog)
    db.commit()
    db.refresh(blog)
    return blog


# ─── ADMIN: UPDATE BLOG ──────────────────────────────────────────────
@router.put("/{blog_id}", response_model=BlogPostResponse)
def update_blog(
    blog_id: int,
    blog_in: BlogPostUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    blog = db.query(BlogPost).filter(BlogPost.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found.")

    update_data = blog_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(blog, field, val)

    db.commit()
    db.refresh(blog)
    return blog


# ─── ADMIN: DELETE BLOG ──────────────────────────────────────────────
@router.delete("/{blog_id}", status_code=status.HTTP_200_OK)
def delete_blog(
    blog_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    blog = db.query(BlogPost).filter(BlogPost.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found.")

    db.delete(blog)
    db.commit()
    return {"message": "Blog post deleted successfully.", "id": blog_id}
