import { Button } from "../components/ui/button";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center gap-6 bg-gray-100">
      <h1 className="text-4xl font-bold">Hello, Tailwind + shadcn/ui!</h1>
      <Button>Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </main>
  );
}
