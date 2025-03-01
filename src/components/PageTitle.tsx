import { useEffect } from "react";

export function PageTitle({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.title = `trackz.ch ${title}`;
    return () => {
      // Reset title when component unmounts
      document.title = "trackz.ch";
    };
  }, [title]);

  return <>{children}</>;
}
