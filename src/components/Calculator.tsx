import React, { useState } from 'react';
import { Calculator as CalculatorIcon, Save, Trash2 } from 'lucide-react';

export const Calculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const inputDigit = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplay(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForSecondOperand) {
      setDisplay('0.');
      setWaitingForSecondOperand(false);
      return;
    }

    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clearDisplay = () => {
    setDisplay('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (firstOperand === null) {
      setFirstOperand(inputValue);
    } else if (operator) {
      const result = calculate(firstOperand, inputValue, operator);
      setDisplay(String(result));
      setFirstOperand(result);
      addToHistory(`${firstOperand} ${operator} ${inputValue} = ${result}`);
    }

    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (firstOperand: number, secondOperand: number, operator: string): number => {
    switch (operator) {
      case '+':
        return firstOperand + secondOperand;
      case '-':
        return firstOperand - secondOperand;
      case '*':
        return firstOperand * secondOperand;
      case '/':
        return firstOperand / secondOperand;
      default:
        return secondOperand;
    }
  };

  const handleEquals = () => {
    if (firstOperand === null || operator === null) return;

    const inputValue = parseFloat(display);
    const result = calculate(firstOperand, inputValue, operator);
    setDisplay(String(result));
    addToHistory(`${firstOperand} ${operator} ${inputValue} = ${result}`);

    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  const addToHistory = (calculation: string) => {
    setHistory(prev => [calculation, ...prev].slice(0, 10)); // Keep only the last 10 calculations
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-800">Financial Calculator</h3>
          <CalculatorIcon className="h-6 w-6 text-blue-600" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Calculator */}
          <div>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <div className="text-right text-3xl font-mono">{display}</div>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <button onClick={clearDisplay} className="col-span-2 bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 transition-colors">
                AC
              </button>
              <button onClick={() => setDisplay(display.slice(0, -1) || '0')} className="bg-gray-200 p-4 rounded-lg hover:bg-gray-300 transition-colors">
                ⌫
              </button>
              <button onClick={() => performOperation('/')} className="bg-blue-100 text-blue-800 p-4 rounded-lg hover:bg-blue-200 transition-colors">
                ÷
              </button>
              
              {[7, 8, 9].map(num => (
                <button 
                  key={num} 
                  onClick={() => inputDigit(String(num))}
                  className="bg-white border border-gray-200 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {num}
                </button>
              ))}
              <button onClick={() => performOperation('*')} className="bg-blue-100 text-blue-800 p-4 rounded-lg hover:bg-blue-200 transition-colors">
                ×
              </button>
              
              {[4, 5, 6].map(num => (
                <button 
                  key={num} 
                  onClick={() => inputDigit(String(num))}
                  className="bg-white border border-gray-200 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {num}
                </button>
              ))}
              <button onClick={() => performOperation('-')} className="bg-blue-100 text-blue-800 p-4 rounded-lg hover:bg-blue-200 transition-colors">
                -
              </button>
              
              {[1, 2, 3].map(num => (
                <button 
                  key={num} 
                  onClick={() => inputDigit(String(num))}
                  className="bg-white border border-gray-200 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {num}
                </button>
              ))}
              <button onClick={() => performOperation('+')} className="bg-blue-100 text-blue-800 p-4 rounded-lg hover:bg-blue-200 transition-colors">
                +
              </button>
              
              <button onClick={() => inputDigit('0')} className="col-span-2 bg-white border border-gray-200 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                0
              </button>
              <button onClick={inputDecimal} className="bg-white border border-gray-200 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                .
              </button>
              <button onClick={handleEquals} className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors">
                =
              </button>
            </div>
          </div>
          
          {/* History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-700">Calculation History</h4>
              <div className="flex gap-2">
                <button 
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Save History"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button 
                  onClick={clearHistory}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  title="Clear History"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 h-[300px] overflow-y-auto">
              {history.length > 0 ? (
                <ul className="space-y-2">
                  {history.map((item, index) => (
                    <li key={index} className="p-2 bg-white rounded border border-gray-100 text-sm font-mono">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No calculations yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Financial Calculators */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Financial Tools</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors">
            <h4 className="font-medium text-blue-800 mb-1">Loan Calculator</h4>
            <p className="text-sm text-gray-600">Calculate loan payments and interest</p>
          </button>
          
          <button className="p-4 bg-green-50 rounded-lg text-left hover:bg-green-100 transition-colors">
            <h4 className="font-medium text-green-800 mb-1">Profit Margin</h4>
            <p className="text-sm text-gray-600">Calculate profit margins and markups</p>
          </button>
          
          <button className="p-4 bg-purple-50 rounded-lg text-left hover:bg-purple-100 transition-colors">
            <h4 className="font-medium text-purple-800 mb-1">Tax Calculator</h4>
            <p className="text-sm text-gray-600">Estimate taxes on sales and income</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Calculator;