import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BuyMeCoffeeProps {
	paymentLink: string;
}

export function BuyMeCoffee({ paymentLink }: BuyMeCoffeeProps) {
	const handleClick = () => {
		window.open(paymentLink, "_blank");
	};

	return (
		<Button
			onClick={handleClick}
			className="w-full bg-[#FFDD00] hover:bg-[#FFCC00] text-black font-semibold gap-2"
		>
			<Coffee className="h-5 w-5" />
			Buy me a coffee ($1)
		</Button>
	);
}

export default BuyMeCoffee;
