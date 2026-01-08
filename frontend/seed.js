// Prisma를 사용한 더미 데이터 추가 스크립트
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  try {
    console.log('🌱 더미 데이터 추가 중...\n');

    // 기존 데이터 확인
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      console.log('⚠️  이미 데이터가 존재합니다. 기존 데이터를 삭제하고 새로 추가하시겠습니까?');
      console.log('   (이 스크립트는 기존 데이터를 유지하고 새 데이터만 추가합니다)\n');
    }

    // 1. 사용자 생성 (2명)
    console.log('👤 사용자 생성 중...');
    const user1 = await prisma.user.create({
      data: {
        email: 'user1@example.com',
        passwordHash: await bcrypt.hash('user123', 10),
        name: '홍길동',
        phone: '010-1111-1111',
        role: 'USER',
        isActive: true,
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'user2@example.com',
        passwordHash: await bcrypt.hash('user123', 10),
        name: '김철수',
        phone: '010-2222-2222',
        role: 'USER',
        isActive: true,
      },
    });
    console.log('✅ 사용자 2명 생성 완료\n');

    // 2. 상품 생성 (2개)
    console.log('🛍️  상품 생성 중...');
    const product1 = await prisma.product.create({
      data: {
        name: '아메리카노',
        description: '진한 에스프레소와 뜨거운 물의 조화',
        price: 4500.00,
        isActive: true,
      },
    });

    const product2 = await prisma.product.create({
      data: {
        name: '카페라떼',
        description: '부드러운 우유와 에스프레소의 만남',
        price: 5000.00,
        isActive: true,
      },
    });
    console.log('✅ 상품 2개 생성 완료\n');

    // 3. 예약 생성 (2개)
    console.log('📅 예약 생성 중...');
    const reservation1 = await prisma.reservation.create({
      data: {
        userId: user1.id,
        reservedAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 내일
        status: 'BOOKED',
        memo: '창가 자리 부탁드립니다',
      },
    });

    const reservation2 = await prisma.reservation.create({
      data: {
        userId: user2.id,
        reservedAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 모레
        status: 'BOOKED',
        memo: '조용한 자리 부탁드립니다',
      },
    });
    console.log('✅ 예약 2개 생성 완료\n');

    // 4. 주문 생성 (2개)
    console.log('🛒 주문 생성 중...');
    const order1 = await prisma.order.create({
      data: {
        userId: user1.id,
        totalAmount: 4500.00,
        status: 'PAID',
        paymentMethod: 'CARD',
        paymentStatus: 'COMPLETED',
      },
    });

    const order2 = await prisma.order.create({
      data: {
        userId: user2.id,
        totalAmount: 5000.00,
        status: 'PAID',
        paymentMethod: 'CARD',
        paymentStatus: 'COMPLETED',
      },
    });
    console.log('✅ 주문 2개 생성 완료\n');

    // 5. 주문 항목 생성 (2개)
    console.log('📦 주문 항목 생성 중...');
    await prisma.orderItem.create({
      data: {
        orderId: order1.id,
        productId: product1.id,
        quantity: 1,
        unitPrice: 4500.00,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order2.id,
        productId: product2.id,
        quantity: 1,
        unitPrice: 5000.00,
      },
    });
    console.log('✅ 주문 항목 2개 생성 완료\n');

    // 6. 리뷰 생성 (2개)
    console.log('⭐ 리뷰 생성 중...');
    await prisma.review.create({
      data: {
        userId: user1.id,
        reservationId: reservation1.id,
        rating: 5,
        comment: '분위기가 좋고 커피도 맛있었어요!',
      },
    });

    await prisma.review.create({
      data: {
        userId: user2.id,
        orderId: order2.id,
        rating: 4,
        comment: '라떼가 정말 맛있었습니다. 다음에도 주문할게요!',
      },
    });
    console.log('✅ 리뷰 2개 생성 완료\n');

    // 7. 갤러리 이미지 생성 (2개)
    console.log('🖼️  갤러리 이미지 생성 중...');
    await prisma.gallery.create({
      data: {
        imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800',
        caption: '아늑한 카페 인테리어',
        isActive: true,
      },
    });

    await prisma.gallery.create({
      data: {
        imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
        caption: '신선한 커피 원두',
        isActive: true,
      },
    });
    console.log('✅ 갤러리 이미지 2개 생성 완료\n');

    // 8. 로그인 로그 생성 (2개)
    console.log('🔐 로그인 로그 생성 중...');
    await prisma.login.create({
      data: {
        userId: user1.id,
        loginAt: new Date(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        success: true,
      },
    });

    await prisma.login.create({
      data: {
        userId: user2.id,
        loginAt: new Date(),
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        success: true,
      },
    });
    console.log('✅ 로그인 로그 2개 생성 완료\n');

    console.log('🎉 모든 더미 데이터 추가 완료!\n');
    console.log('📝 로그인 정보:');
    console.log('   - user1@example.com / user123');
    console.log('   - user2@example.com / user123\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });





