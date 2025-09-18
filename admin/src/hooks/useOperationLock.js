import { useState, useEffect } from 'react';

const OPERATION_KEY = 'import-export-operation';

export const useOperationLock = () => {
  const [isAnyOperationRunning, setIsAnyOperationRunning] = useState(false);

  useEffect(() => {
    // Проверяем состояние при монтировании
    const checkOperation = () => {
      const operation = localStorage.getItem(OPERATION_KEY);
      setIsAnyOperationRunning(!!operation);
    };

    checkOperation();

    // Слушаем изменения localStorage
    const handleStorageChange = (e) => {
      if (e.key === OPERATION_KEY) {
        setIsAnyOperationRunning(!!e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Также проверяем каждые 500мс для одной вкладки
    const interval = setInterval(checkOperation, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const lockOperation = (type, jobId) => {
    const operation = { type, jobId, startTime: Date.now() };
    localStorage.setItem(OPERATION_KEY, JSON.stringify(operation));
    setIsAnyOperationRunning(true);
  };

  const unlockOperation = () => {
    localStorage.removeItem(OPERATION_KEY);
    setIsAnyOperationRunning(false);
  };

  const getCurrentOperation = () => {
    const operation = localStorage.getItem(OPERATION_KEY);
    return operation ? JSON.parse(operation) : null;
  };

  return {
    isAnyOperationRunning,
    lockOperation,
    unlockOperation,
    getCurrentOperation
  };
};

