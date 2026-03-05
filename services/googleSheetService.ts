import { SheetQuizResult, StudentInfo } from '../types';

/**
 * Service giao tiếp với Google Sheets thông qua Google Apps Script Web App.
 */

const TIMEOUT_MS = 15000;

/**
 * Gửi kết quả bài quiz lên Google Sheets.
 */
export const submitQuizResult = async (
    sheetUrl: string,
    result: SheetQuizResult
): Promise<{ success: boolean; message: string }> => {
    if (!sheetUrl) {
        return { success: false, message: 'Chưa cấu hình Google Sheets URL' };
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(sheetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'submit',
                data: result
            }),
            signal: controller.signal,
            mode: 'no-cors' // Apps Script requires this for cross-origin
        });

        clearTimeout(timeoutId);

        // With no-cors, we can't read the response body, so we assume success
        // if no error was thrown
        return { success: true, message: 'Đã gửi kết quả thành công!' };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return { success: false, message: 'Hết thời gian chờ. Kết quả vẫn được lưu cục bộ.' };
        }
        console.error('Error submitting to Google Sheet:', error);
        return { success: false, message: `Lỗi gửi dữ liệu: ${error.message}` };
    }
};

/**
 * Lấy lịch sử làm bài của học sinh từ Google Sheets.
 */
export const getStudentHistory = async (
    sheetUrl: string,
    studentName: string,
    studentClass: string
): Promise<{ success: boolean; data: any[]; message: string }> => {
    if (!sheetUrl) {
        return { success: false, data: [], message: 'Chưa cấu hình Google Sheets URL' };
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const url = `${sheetUrl}?action=history&name=${encodeURIComponent(studentName)}&class=${encodeURIComponent(studentClass)}`;

        const response = await fetch(url, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        return { success: true, data: json.data || [], message: 'OK' };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return { success: false, data: [], message: 'Hết thời gian chờ.' };
        }
        console.error('Error fetching history:', error);
        return { success: false, data: [], message: `Lỗi: ${error.message}` };
    }
};

/**
 * Tạo SheetQuizResult từ dữ liệu quiz state.
 */
export const buildSheetResult = (
    studentInfo: StudentInfo,
    level: string,
    grade: number,
    topic: string,
    questions: any[],
    userAnswers: Record<string, string>,
    score: number,
    startTime: number,
    endTime: number
): SheetQuizResult => {
    const timeTakenSeconds = Math.floor((endTime - startTime) / 1000);

    const details = questions.map((q, idx) => ({
        questionIndex: idx + 1,
        correct: userAnswers[q.id] === q.correctAnswer,
        difficulty: q.difficulty
    }));

    return {
        timestamp: new Date().toLocaleString('vi-VN'),
        studentName: studentInfo.name,
        studentClass: studentInfo.className,
        level: level,
        grade: grade,
        topic: topic,
        totalQuestions: questions.length,
        correctCount: score,
        incorrectCount: questions.length - score,
        scorePercent: Math.round((score / questions.length) * 100),
        timeTakenSeconds,
        details
    };
};
