import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BuyMeCoffeeProps {
	username: string;
}

export function BuyMeCoffee({ username }: BuyMeCoffeeProps) {
	const handleClick = () => {
		window.open(`https://buymeacoffee.com/${username}`, "_blank");
	};

	return (
		<Button
			onClick={handleClick}
			className="w-full bg-[#FFDD00] hover:bg-[#FFCC00] text-black font-semibold gap-2"
		>
			<Coffee className="h-5 w-5" />
			Buy me a coffee
		</Button>
	);
}

export default BuyMeCoffee;
