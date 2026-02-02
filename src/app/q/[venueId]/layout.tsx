export default function QRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="hospitality min-h-screen bg-background">
      {children}
    </div>
  );
}
