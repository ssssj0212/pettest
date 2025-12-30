"""
간단한 API 스모크 테스트
실행: python -m pytest backend/test_api.py -v
또는: python backend/test_api.py
"""
import sys
import os

# 프로젝트 루트를 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_check():
    """헬스 체크 테스트"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_register_user():
    """회원가입 테스트"""
    response = client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpass123",
            "name": "Test User",
            "phone": "123-456-7890",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["email"] == "test@example.com"


def test_login():
    """로그인 테스트"""
    # 먼저 회원가입
    client.post(
        "/auth/register",
        json={
            "email": "login_test@example.com",
            "password": "testpass123",
            "name": "Login Test",
        },
    )

    # 로그인
    response = client.post(
        "/auth/login",
        data={
            "username": "login_test@example.com",
            "password": "testpass123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_get_products():
    """상품 목록 조회 테스트"""
    response = client.get("/products")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_reviews():
    """리뷰 목록 조회 테스트"""
    response = client.get("/reviews")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_gallery():
    """갤러리 목록 조회 테스트"""
    response = client.get("/gallery")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


if __name__ == "__main__":
    print("Running smoke tests...")
    try:
        test_health_check()
        print("✓ Health check passed")
        
        test_register_user()
        print("✓ User registration passed")
        
        test_login()
        print("✓ Login passed")
        
        test_get_products()
        print("✓ Get products passed")
        
        test_get_reviews()
        print("✓ Get reviews passed")
        
        test_get_gallery()
        print("✓ Get gallery passed")
        
        print("\n✅ All smoke tests passed!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)


