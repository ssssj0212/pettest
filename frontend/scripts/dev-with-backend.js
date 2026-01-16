// 프론트엔드와 백엔드를 동시에 실행하는 스크립트
const { spawn } = require('child_process');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '../..');
const frontendDir = path.join(projectRoot, 'frontend');
const backendDir = path.join(projectRoot, 'backend');
const isWindows = process.platform === 'win32';

// Python 실행 파일 경로
const backendPython = isWindows 
  ? path.join(projectRoot, 'venv', 'Scripts', 'python.exe')
  : path.join(projectRoot, 'venv', 'bin', 'python3');

// npm 실행 파일 찾기 (Windows에서 안전하게)
function findNpmCommand() {
  if (!isWindows) {
    return 'npm';
  }
  
  // Windows에서 npm.cmd 찾기
  try {
    // where.exe로 npm.cmd 찾기
    const whereResult = execSync('where.exe npm.cmd', { encoding: 'utf-8', stdio: 'pipe' });
    const npmPath = whereResult.trim().split('\n')[0];
    if (npmPath && fs.existsSync(npmPath)) {
      return npmPath;
    }
  } catch (err) {
    // where.exe 실패 시 npm.cmd 직접 시도
  }
  
  // 기본값으로 npm.cmd 시도 (PATH에 있으면 작동)
  return 'npm.cmd';
}

const npmCommand = findNpmCommand();

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

// npm 명령어 검증
if (!npmCommand) {
  throw new Error('❌ npm 명령어를 찾을 수 없습니다. Node.js가 설치되어 있는지 확인하세요.');
}

console.log(`📋 사용 명령어:`);
console.log(`   백엔드: ${backendPython}`);
console.log(`   프론트: ${npmCommand}\n`);

// 백엔드 서버 시작
// shell: false로 설정하여 경로에 쉼표/공백이 있어도 안전하게 실행
console.log('📦 백엔드 서버 시작 중...');
const backendProcess = spawn(backendPython, [
  '-m', 'uvicorn',
  'backend.main:app',
  '--reload',
  '--port', '8000',
  '--host', '0.0.0.0'
], {
  cwd: projectRoot, // 프로젝트 루트에서 실행 (backend.main:app 모듈 경로)
  stdio: 'inherit',
  shell: false, // shell: false로 변경하여 경로 안전 처리
  env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
});

// 프론트엔드 서버 시작
// Windows에서 npm.cmd를 사용하되 shell: false로 안전하게 실행
console.log('🎨 프론트엔드 서버 시작 중...');
const frontendProcess = spawn(npmCommand, ['run', 'dev:frontend'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: false // shell: false로 변경하여 경로 안전 처리
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
  if (err.code === 'EINVAL') {
    console.error('💡 EINVAL 에러: 실행 파일 경로가 잘못되었습니다.');
    console.error(`   Python 경로: ${backendPython}`);
    console.error(`   경로 존재 여부: ${fs.existsSync(backendPython)}`);
  }
  console.error('💡 백엔드를 수동으로 실행해보세요:');
  console.error(`   ${backendPython} -m uvicorn backend.main:app --reload --port 8000`);
  cleanup();
});

frontendProcess.on('error', (err) => {
  console.error('❌ 프론트엔드 서버 시작 실패:', err.message);
  if (err.code === 'EINVAL') {
    console.error('💡 EINVAL 에러: 실행 파일 경로가 잘못되었습니다.');
    console.error(`   npm 명령어: ${npmCommand}`);
    console.error('💡 해결 방법:');
    console.error('   1. Node.js가 설치되어 있는지 확인하세요');
    console.error('   2. npm이 PATH에 있는지 확인하세요');
    console.error('   3. PowerShell에서 "where.exe npm.cmd"로 경로 확인');
  }
  console.error('💡 프론트엔드를 수동으로 실행해보세요:');
  console.error('   npm run dev:frontend');
  cleanup();
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
