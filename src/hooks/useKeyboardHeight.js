import { useEffect, useState } from 'react';

/**
 * 监听小程序键盘高度变化（WeChat）
 * 返回：{ keyboardHeight: number(px), isOpen: boolean }
 */
export default function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Remax 下可直接使用 wx
    const wxGlobal = typeof wx !== 'undefined' ? wx : null;
    if (!wxGlobal || !wxGlobal.onKeyboardHeightChange) {
      // 非小程序环境或 API 不可用时，保持为 0
      return;
    }

    const handler = (res) => {
      const height = Number(res?.height || 0);
      setKeyboardHeight(height);
      setIsOpen(height > 0);
    };

    wxGlobal.onKeyboardHeightChange(handler);

    return () => {
      if (wxGlobal.offKeyboardHeightChange) {
        wxGlobal.offKeyboardHeightChange(handler);
      }
    };
  }, []);

  return { keyboardHeight, isOpen };
}