import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      toastOptions={{
        style: {
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "0.875rem",
        },
      }}
      {...props}
    />
  );
}
