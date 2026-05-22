export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100">
      {children}
    </div>
  );
}
