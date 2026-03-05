import React, { useState, useEffect } from 'react';
import { User, X, LogIn, BookOpen } from 'lucide-react';
import { StudentInfo } from '../types';

interface StudentLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (info: StudentInfo) => void;
    currentInfo: StudentInfo | null;
    isMandatory: boolean;
}

const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
    isOpen,
    onClose,
    onSave,
    currentInfo,
    isMandatory
}) => {
    const [name, setName] = useState(currentInfo?.name || '');
    const [className, setClassName] = useState(currentInfo?.className || '');
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentInfo) {
            setName(currentInfo.name);
            setClassName(currentInfo.className);
        }
    }, [currentInfo]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        setError('');

        if (!name.trim()) {
            setError('Vui lòng nhập họ tên');
            return;
        }
        if (name.trim().length < 2) {
            setError('Họ tên phải có ít nhất 2 ký tự');
            return;
        }
        if (!className.trim()) {
            setError('Vui lòng nhập lớp');
            return;
        }

        onSave({
            name: name.trim(),
            className: className.trim()
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-[90vw] max-w-md overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white relative">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
                    <div className="flex items-center gap-3 relative">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <User className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Thông tin học sinh</h2>
                            <p className="text-sm opacity-90">Nhập tên và lớp để bắt đầu</p>
                        </div>
                    </div>
                    {!isMandatory && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Info Box */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700 leading-relaxed">
                            Thông tin này giúp theo dõi quá trình học tập của em trên Google Sheets. Kết quả mỗi lần làm bài sẽ được lưu lại.
                        </p>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                            Họ và tên
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="VD: Nguyễn Văn A"
                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none font-medium text-gray-700 transition-all placeholder:text-gray-300"
                            autoFocus
                        />
                    </div>

                    {/* Class Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                            Lớp
                        </label>
                        <input
                            type="text"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="VD: 10A1, 6B, 12C3..."
                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none font-medium text-gray-700 transition-all placeholder:text-gray-300"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center animate-fade-in">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <LogIn className="w-5 h-5" />
                        {currentInfo ? 'CẬP NHẬT' : 'BẮT ĐẦU HỌC 🚀'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentLoginModal;
