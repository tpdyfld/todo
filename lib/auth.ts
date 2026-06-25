import jwt from "jsonwebtoken";

// JWT 서명을 위한 비밀키 설정. 실서비스에서는 환경 변수로 관리하며, 설정이 없으면 기본 백업 키를 사용합니다.
const JWT_SECRET = process.env.JWT_SECRET || "antigravity-secret-key-12345!@#";

// 토큰 내부에 담길 사용자 정보 페이로드 타입 정의
export interface TokenPayload {
  userId: number;
  username: string;
}

/**
 * 1. signToken: 사용자 식별자와 이름을 기반으로 1일 동안 유효한 JWT 토큰을 발행합니다.
 * @param payload - 토큰에 인코딩하여 저장할 사용자 정보
 * @returns 서명된 JWT 토큰 문자열
 */
export function signToken(payload: TokenPayload): string {
  // jwt.sign() 메소드를 호출해 토큰을 발행하며, 만료 기간을 24시간(1d)으로 지정합니다.
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

/**
 * 2. verifyToken: 전달받은 JWT 토큰의 서명 및 만료일을 검증하고 내부 데이터를 복호화합니다.
 * @param token - 검증할 JWT 토큰 문자열
 * @returns 검증 통과 시 복호화된 페이로드 객체, 실패 시 null
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    // jwt.verify() 메소드를 통해 비밀키와 서명을 검증합니다.
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    // 서명이 잘못되었거나, 토큰이 위조되었거나, 만료 기한이 지나면 에러가 발생해 null을 반환합니다.
    return null;
  }
}

/**
 * 3. getUserIdFromRequest: Next.js API 요청 객체로부터 'auth_token' 쿠키를 파싱하여 사용자 ID를 획득합니다.
 * @param request - Next.js Request 객체
 * @returns 인증된 사용자의 고유 ID(Number), 미인증 시 null
 */
export function getUserIdFromRequest(request: Request): number | null {
  try {
    // 요청 헤더에서 'cookie' 스트링을 추출합니다.
    const cookieHeader = request.headers.get("cookie") || "";
    
    // 쿠키 헤더 문자열에서 'auth_token' 쿠키 값을 정규식을 통해 파싱합니다.
    const authTokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
    if (!authTokenMatch) {
      return null;
    }

    const token = authTokenMatch[1];
    
    // 획득한 토큰을 검증합니다.
    const decodedPayload = verifyToken(token);
    if (!decodedPayload) {
      return null;
    }

    // 검증이 완료된 사용자의 id를 반환합니다.
    return decodedPayload.userId;
  } catch (error) {
    console.error("요청 토큰 분석 중 오류 발생:", error);
    return null;
  }
}
