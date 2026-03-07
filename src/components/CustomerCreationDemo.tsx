import React, { useState } from 'react';
import { UserPlus, CheckCircle, ArrowRight, Search, Plus } from 'lucide-react';

export const CustomerCreationDemo: React.FC = () => {
  const [demoStep, setDemoStep] = useState(0);

  const steps = [
    {
      title: "Search Existing Customer",
      description: "Type to search through existing customers",
      icon: <Search className="h-6 w-6" />,
      content: (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search customers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              disabled
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            As you type, matching customers will appear in the dropdown
          </div>
        </div>
      )
    },
    {
      title: "Create New Customer",
      description: "Click 'Create New Customer' to add a new customer",
      icon: <Plus className="h-6 w-6" />,
      content: (
        <div className="bg-blue-50 p-4 rounded-lg">
          <button className="w-full px-4 py-3 text-left hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-600">
            <UserPlus className="h-4 w-4" />
            <span className="font-medium">Create New Customer</span>
          </button>
          <div className="mt-2 text-sm text-blue-700">
            This option appears at the top of the customer dropdown
          </div>
        </div>
      )
    },
    {
      title: "Fill Customer Details",
      description: "Enter customer information in the popup form",
      icon: <UserPlus className="h-6 w-6" />,
      content: (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                placeholder="Enter customer name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="Enter phone number (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="Enter email address (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                placeholder="Enter address (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                disabled
              />
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Customer Created",
      description: "New customer is automatically selected and ready to use",
      icon: <CheckCircle className="h-6 w-6" />,
      content: (
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-green-900">John Doe</div>
              <div className="text-sm text-green-700">📞 +1 234-567-8900 • ✉️ john@example.com</div>
            </div>
            <button className="text-green-600 hover:text-green-800">
              <CheckCircle className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 text-sm text-green-700">
            Customer is now selected and ready for the transaction
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (demoStep < steps.length - 1) {
      setDemoStep(demoStep + 1);
    }
  };

  const prevStep = () => {
    if (demoStep > 0) {
      setDemoStep(demoStep - 1);
    }
  };

  const resetDemo = () => {
    setDemoStep(0);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Customer Creation Demo</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">
        Learn how to create new customers directly when creating invoices, transactions, or payments.
      </p>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {demoStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((demoStep + 1) / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((demoStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            {steps[demoStep].icon}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{steps[demoStep].title}</h4>
            <p className="text-sm text-gray-600">{steps[demoStep].description}</p>
          </div>
        </div>
        
        {steps[demoStep].content}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={demoStep === 0}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          Previous
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={resetDemo}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Reset
          </button>
          
          {demoStep < steps.length - 1 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={resetDemo}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              Complete
            </button>
          )}
        </div>
      </div>

      {/* Features List */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Key Features:</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Search existing customers by name, phone, or email
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Create new customers with minimal required information
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Automatic customer selection after creation
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Works in all transaction forms (invoices, payments, sales)
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Real-time customer list updates
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CustomerCreationDemo;
