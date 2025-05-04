const StatusBadge = ({ success, message }) => (
    <div className="mb-2">
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          success
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {success ? '✓ Success' : '✗ Error'}
      </span>
      <div className="text-sm">{message}</div>
    </div>
  );
  
  export default StatusBadge;