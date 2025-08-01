import { CheckCircle } from 'lucide-react';

export const ServerStatus = () => {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <CheckCircle className="w-4 h-4 text-green-500" />
      <span>Servidor operativo</span>
    </div>
  );
};
