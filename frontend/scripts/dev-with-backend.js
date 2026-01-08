// 프론트엔드와 백엔드를 동시에 실행하는 스크립트
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '../..');
const frontendDir = path.join(projectRoot, 'frontend');
const isWindows = process.platform === 'win32';
const backendPython = isWindows 
  ? path.join(projectRoot, 'venv', 'Scripts', 'python.exe')
  : path.join(projectRoot, 'venv', 'bin', 'python');

console.log('🚀 서버 시작 중...\n');

// Python 경로 확인
if (!fs.existsSync(backendPython)) {
  console.error('❌ Python 가상환경을 찾을 수 없습니다.');
  console.error(`경로: ${backendPython}`);
  console.error('\n💡 해결 방법:');
  console.error('  1. 가상환경이 생성되어 있는지 확인하세요');
  console.error('  2. venv 폴더가 프로젝트 루트에 있는지 확인하세요');
  process.exit(1);
}

// 백엔드 서버 시작
console.log('📦 백엔드 서버 시작 중...');
const backendProcess = spawn(backendPython, [
  '-m', 'uvicorn',
  'backend.main:app',
  '--reload',
  '--port', '8000',
  '--host', '0.0.0.0'
], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: isWindows,
  env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
});

// 프론트엔드 서버 시작
console.log('🎨 프론트엔드 서버 시작 중...');
const frontendProcess = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev:frontend'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: isWindows
});

// 프로세스 종료 처리
const cleanup = () => {
  console.log('\n🛑 서버 종료 중...');
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill('SIGTERM');
  }
  if (frontendProcess && !frontendProcess.killed) {
    frontendProcess.kill('SIGTERM');
  }
  setTimeout(() => {
    process.exit(0);
  }, 1000);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// 에러 처리
backendProcess.on('error', (err) => {
  console.error('❌ 백엔드 서버 시작 실패:', err.message);
  console.error('💡 백엔드를 수동으로 실행해보세요:');
  console.error(`   ${backendPython} -m uvicorn backend.main:app --reload --port 8000`);
});

frontendProcess.on('error', (err) => {
  console.error('❌ 프론트엔드 서버 시작 실패:', err.message);
  console.error('💡 프론트엔드를 수동으로 실행해보세요:');
  console.error('   npm run dev:frontend');
});

// 프로세스 종료 감지
backendProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n⚠️  백엔드 서버가 종료되었습니다 (코드: ${code})`);
  }
});

frontendProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n⚠️  프론트엔드 서버가 종료되었습니다 (코드: ${code})`);
  }
  cleanup();
});

console.log('\n✅ 서버가 시작되었습니다!');
console.log('📍 프론트엔드: http://localhost:3000');
console.log('📍 백엔드 API: http://localhost:8000');
console.log('📍 백엔드 문서: http://localhost:8000/docs');
console.log('\n💡 서버를 중지하려면 Ctrl+C를 누르세요\n');

