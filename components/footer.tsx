import { BrainCircuit, Facebook } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border flex items-center justify-between p-4 md:h-20 md:pl-2 md:pr-4 md:py-0">
      <Button className="gap-1 font-medium" variant="ghost">
        <BrainCircuit />
        Rethink Software Lab
      </Button>
      <Link
        target="blank"
        href="https://www.facebook.com/profile.php?id=61559914711618"
      >
        <Button variant="outline" className="text-muted-foreground" size="icon">
          <Facebook size={20} />
        </Button>
      </Link>
    </footer>
  );
}
