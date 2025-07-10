
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container ms-auto mt-24 mb-20">
      {children}
    </div>
  );
}