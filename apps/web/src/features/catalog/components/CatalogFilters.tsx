'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Slider } from '@/design-system/primitives/slider';
import { Checkbox } from '@/design-system/primitives/checkbox';
import { Label } from '@/design-system/primitives/label';
import { Button } from '@/design-system/primitives/button';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/design-system/primitives/accordion';

export function CatalogFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [priceRange, setPriceRange] = useState([0, 200]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

    // Initialize from URL
    useEffect(() => {
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        if (minPrice && maxPrice) {
            setPriceRange([Number(minPrice), Number(maxPrice)]);
        }

        const categories = searchParams.get('category')?.split(',') || [];
        setSelectedCategories(categories);

        const platforms = searchParams.get('platform')?.split(',') || [];
        setSelectedPlatforms(platforms);
    }, [searchParams]);

    const updateFilters = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (selectedCategories.length > 0) {
            params.set('category', selectedCategories.join(','));
        } else {
            params.delete('category');
        }

        if (selectedPlatforms.length > 0) {
            params.set('platform', selectedPlatforms.join(','));
        } else {
            params.delete('platform');
        }

        params.set('minPrice', (priceRange[0] ?? 0).toString());
        params.set('maxPrice', (priceRange[1] ?? 200).toString());
        params.set('page', '1'); // Reset to page 1 on filter change

        router.push(`/catalog?${params.toString()}`);
    };

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const togglePlatform = (platform: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="mb-4 text-lg font-semibold">Filters</h3>
                <Accordion type="single" collapsible defaultValue="category" className="w-full">
                    <AccordionItem value="category">
                        <AccordionTrigger>Category</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2">
                                {['Action', 'Adventure', 'RPG', 'Strategy', 'Sports'].map((category) => (
                                    <div key={category} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`category-${category}`}
                                            checked={selectedCategories.includes(category)}
                                            onCheckedChange={() => toggleCategory(category)}
                                        />
                                        <Label htmlFor={`category-${category}`}>{category}</Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="platform">
                        <AccordionTrigger>Platform</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2">
                                {['Steam', 'Origin', 'Uplay', 'Xbox', 'PlayStation'].map((platform) => (
                                    <div key={platform} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`platform-${platform}`}
                                            checked={selectedPlatforms.includes(platform)}
                                            onCheckedChange={() => togglePlatform(platform)}
                                        />
                                        <Label htmlFor={`platform-${platform}`}>{platform}</Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="price">
                        <AccordionTrigger>Price Range</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 pt-2">
                                <Slider
                                    defaultValue={[0, 200]}
                                    max={200}
                                    step={1}
                                    value={priceRange}
                                    onValueChange={setPriceRange}
                                />
                                <div className="flex items-center justify-between text-sm">
                                    <span>${priceRange[0] ?? 0}</span>
                                    <span>${priceRange[1] ?? 200}</span>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
            <Button className="w-full" onClick={updateFilters}>
                Apply Filters
            </Button>
            <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push('/catalog')}
            >
                Reset Filters
            </Button>
        </div>
    );
}
