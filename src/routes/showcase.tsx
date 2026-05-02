import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AlertTriangleIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteContent,
  AutocompleteList,
  AutocompleteItem,
  AutocompleteEmpty,
  AutocompleteCollection,
  AutocompleteGroup,
  AutocompleteGroupLabel,
} from "@/components/reui/autocomplete";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Sample data for autocomplete
interface Tag {
  id: string;
  value: string;
}

const tags: Tag[] = [
  { id: "1", value: "feature" },
  { id: "2", value: "bug" },
  { id: "3", value: "enhancement" },
  { id: "4", value: "documentation" },
  { id: "5", value: "refactor" },
  { id: "6", value: "testing" },
  { id: "7", value: "design" },
  { id: "8", value: "performance" },
  { id: "9", value: "accessibility" },
  { id: "10", value: "security" },
];

interface Country {
  code: string;
  name: string;
  region: string;
}

const countries: Country[] = [
  { code: "us", name: "United States", region: "North America" },
  { code: "ca", name: "Canada", region: "North America" },
  { code: "mx", name: "Mexico", region: "North America" },
  { code: "uk", name: "United Kingdom", region: "Europe" },
  { code: "de", name: "Germany", region: "Europe" },
  { code: "fr", name: "France", region: "Europe" },
  { code: "it", name: "Italy", region: "Europe" },
  { code: "es", name: "Spain", region: "Europe" },
  { code: "jp", name: "Japan", region: "Asia" },
  { code: "cn", name: "China", region: "Asia" },
  { code: "kr", name: "South Korea", region: "Asia" },
  { code: "in", name: "India", region: "Asia" },
  { code: "au", name: "Australia", region: "Oceania" },
  { code: "nz", name: "New Zealand", region: "Oceania" },
  { code: "br", name: "Brazil", region: "South America" },
  { code: "ar", name: "Argentina", region: "South America" },
  { code: "za", name: "South Africa", region: "Africa" },
  { code: "eg", name: "Egypt", region: "Africa" },
];

interface CountryGroup {
  region: string;
  items: Country[];
}

const groupedCountries: CountryGroup[] = [
  {
    region: "North America",
    items: countries.filter((c) => c.region === "North America"),
  },
  {
    region: "Europe",
    items: countries.filter((c) => c.region === "Europe"),
  },
  {
    region: "Asia",
    items: countries.filter((c) => c.region === "Asia"),
  },
  {
    region: "Oceania",
    items: countries.filter((c) => c.region === "Oceania"),
  },
  {
    region: "South America",
    items: countries.filter((c) => c.region === "South America"),
  },
  {
    region: "Africa",
    items: countries.filter((c) => c.region === "Africa"),
  },
];

const programmingLanguages = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
  "Ruby",
  "PHP",
  "Scala",
  "Clojure",
  "Haskell",
  "Elixir",
  "Dart",
  "Lua",
  "Perl",
  "R",
  "Julia",
  "Zig",
  "Nim",
  "Crystal",
];

export const Route = createFileRoute("/showcase")({
  component: ShowcasePage,
});

// Button variants from button.tsx
const variants = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const;

// Button sizes from button.tsx (excluding icon sizes for text buttons)
const textSizes = ["xs", "sm", "default", "lg"] as const;
const iconSizes = ["icon-xs", "icon-sm", "icon", "icon-lg"] as const;

function ShowcasePage() {
  // Only show in dev mode
  if (!import.meta.env.DEV) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-foreground">Component Showcase</h1>
          <p className="text-muted-foreground">All components available in the design system.</p>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Text Buttons Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Text Buttons</h2>
            <div className="space-y-4">
              {variants.map((variant) => (
                <div key={variant} className="space-y-2">
                  <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    {variant}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {textSizes.map((size) => (
                      <Button key={size} variant={variant} size={size}>
                        {size === "default" ? variant : size}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Icon Buttons Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Icon Buttons</h2>
            <div className="space-y-4">
              {variants.map((variant) => (
                <div key={variant} className="space-y-2">
                  <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    {variant}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {iconSizes.map((size) => (
                      <Button
                        key={size}
                        variant={variant}
                        size={size}
                        aria-label={`${variant} ${size}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Disabled State Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Disabled States</h2>
            <div className="space-y-4">
              {variants.map((variant) => (
                <div key={variant} className="space-y-2">
                  <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    {variant}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant={variant} size="default" disabled>
                      Disabled
                    </Button>
                    <Button variant={variant} size="sm" disabled>
                      Small
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Full Width Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Full Width</h2>
          <div className="space-y-4">
            {variants.map((variant) => (
              <Button key={variant} variant={variant} size="default" className="w-full">
                Full Width {variant}
              </Button>
            ))}
          </div>
        </section>

        {/* Autocomplete Section */}
        <AutocompleteShowcase />

        {/* Select Section */}
        <SelectShowcase />

        {/* Alert Dialog Section */}
        <AlertDialogShowcase />

        {/* Dialog with AlertDialog Section */}
        <DialogWithAlertDialogShowcase />

        {/* Footer */}
        <footer className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>This page is only visible in development mode.</p>
        </footer>
      </div>
    </div>
  );
}

function AutocompleteShowcase() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [groupValue, setGroupValue] = useState<string>("");
  const { contains } = AutocompletePrimitive.useFilter({ sensitivity: "base" });

  // Filter for grouped countries
  const filteredGroups = useMemo(() => {
    if (!groupValue) return groupedCountries;
    return groupedCountries
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => contains(item.name, groupValue) || contains(item.region, groupValue),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groupValue, contains]);

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Autocomplete</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic Autocomplete */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Basic
          </h3>
          <Autocomplete
            items={programmingLanguages}
            value={selectedLanguage}
            onValueChange={setSelectedLanguage}
          >
            <AutocompleteInput placeholder="Search programming languages..." className="w-full" />
            <AutocompleteContent>
              <AutocompleteList>
                <AutocompleteCollection>
                  {(item: string) => (
                    <AutocompleteItem key={item} value={item}>
                      {item}
                    </AutocompleteItem>
                  )}
                </AutocompleteCollection>
              </AutocompleteList>
            </AutocompleteContent>
          </Autocomplete>
        </div>

        {/* With Clear Button */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            With Clear Button
          </h3>
          <Autocomplete
            items={programmingLanguages}
            value={selectedLanguage}
            onValueChange={setSelectedLanguage}
          >
            <AutocompleteInput
              placeholder="Search with clear button..."
              showClear
              className="w-full"
            />
            <AutocompleteContent>
              <AutocompleteList>
                <AutocompleteCollection>
                  {(item: string) => (
                    <AutocompleteItem key={item} value={item}>
                      {item}
                    </AutocompleteItem>
                  )}
                </AutocompleteCollection>
              </AutocompleteList>
            </AutocompleteContent>
          </Autocomplete>
        </div>

        {/* With Trigger Button */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            With Trigger Button
          </h3>
          <Autocomplete
            items={programmingLanguages}
            value={selectedLanguage}
            onValueChange={setSelectedLanguage}
          >
            <AutocompleteInput
              placeholder="Click to see all options..."
              showTrigger
              className="w-full"
            />
            <AutocompleteContent>
              <AutocompleteList>
                <AutocompleteCollection>
                  {(item: string) => (
                    <AutocompleteItem key={item} value={item}>
                      {item}
                    </AutocompleteItem>
                  )}
                </AutocompleteCollection>
              </AutocompleteList>
            </AutocompleteContent>
          </Autocomplete>
        </div>

        {/* With Custom Item Rendering */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Custom Item Rendering
          </h3>
          <Autocomplete
            items={countries}
            value={selectedCountry}
            onValueChange={setSelectedCountry}
          >
            <AutocompleteInput
              placeholder="Search countries..."
              showClear
              showTrigger
              className="w-full"
            />
            <AutocompleteContent>
              <AutocompleteList>
                <AutocompleteEmpty>No countries found</AutocompleteEmpty>
                <AutocompleteCollection>
                  {(item: Country) => (
                    <AutocompleteItem key={item.code} value={item.name}>
                      <span className="mr-2">{getCountryFlag(item.code)}</span>
                      <span className="flex-1">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.region}</span>
                    </AutocompleteItem>
                  )}
                </AutocompleteCollection>
              </AutocompleteList>
            </AutocompleteContent>
          </Autocomplete>
        </div>

        {/* Grouped Options */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Grouped Options
          </h3>
          <Autocomplete
            items={filteredGroups}
            value={groupValue}
            onValueChange={setGroupValue}
            filter={null}
            autoHighlight
          >
            <AutocompleteInput
              placeholder="Search countries by region..."
              showClear
              showTrigger
              className="w-full"
            />
            <AutocompleteContent>
              <AutocompleteList>
                <AutocompleteEmpty>No countries found</AutocompleteEmpty>
                <AutocompleteCollection>
                  {(group: CountryGroup) => (
                    <AutocompleteGroup items={group.items}>
                      <AutocompleteGroupLabel>{group.region}</AutocompleteGroupLabel>
                      <AutocompleteCollection>
                        {(item: Country) => (
                          <AutocompleteItem key={item.code} value={item.name}>
                            <span className="mr-2">{getCountryFlag(item.code)}</span>
                            {item.name}
                          </AutocompleteItem>
                        )}
                      </AutocompleteCollection>
                    </AutocompleteGroup>
                  )}
                </AutocompleteCollection>
              </AutocompleteList>
            </AutocompleteContent>
          </Autocomplete>
        </div>

        {/* Disabled State */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Disabled
          </h3>
          <Autocomplete items={tags.map((t) => t.value)} disabled>
            <AutocompleteInput placeholder="Disabled autocomplete..." disabled className="w-full" />
            <AutocompleteContent>
              <AutocompleteList>
                <AutocompleteCollection>
                  {(item: string) => (
                    <AutocompleteItem key={item} value={item}>
                      {item}
                    </AutocompleteItem>
                  )}
                </AutocompleteCollection>
              </AutocompleteList>
            </AutocompleteContent>
          </Autocomplete>
        </div>
      </div>

      {/* Different Sizes - Full Width */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Sizes
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Autocomplete
            items={tags.map((t) => t.value)}
            value={selectedTag}
            onValueChange={setSelectedTag}
          >
            <AutocompleteInput size="sm" placeholder="Small size..." showClear className="w-full" />
            <AutocompleteContent>
              <AutocompleteList>
                <AutocompleteCollection>
                  {(item: string) => (
                    <AutocompleteItem key={item} value={item}>
                      {item}
                    </AutocompleteItem>
                  )}
                </AutocompleteCollection>
              </AutocompleteList>
            </AutocompleteContent>
          </Autocomplete>

          <Autocomplete
            items={tags.map((t) => t.value)}
            value={selectedTag}
            onValueChange={setSelectedTag}
          >
            <AutocompleteInput
              size="default"
              placeholder="Default size..."
              showClear
              className="w-full"
            />
            <AutocompleteContent>
              <AutocompleteList>
                <AutocompleteCollection>
                  {(item: string) => (
                    <AutocompleteItem key={item} value={item}>
                      {item}
                    </AutocompleteItem>
                  )}
                </AutocompleteCollection>
              </AutocompleteList>
            </AutocompleteContent>
          </Autocomplete>

          <Autocomplete
            items={tags.map((t) => t.value)}
            value={selectedTag}
            onValueChange={setSelectedTag}
          >
            <AutocompleteInput size="lg" placeholder="Large size..." showClear className="w-full" />
            <AutocompleteContent>
              <AutocompleteList>
                <AutocompleteCollection>
                  {(item: string) => (
                    <AutocompleteItem key={item} value={item}>
                      {item}
                    </AutocompleteItem>
                  )}
                </AutocompleteCollection>
              </AutocompleteList>
            </AutocompleteContent>
          </Autocomplete>
        </div>
      </div>
    </section>
  );
}

function SelectShowcase() {
  const [language, setLanguage] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [tag, setTag] = useState<string>("");

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Select</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic Select */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Basic
          </h3>
          <Select value={language} onValueChange={(v) => setLanguage(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a language" />
            </SelectTrigger>
            <SelectContent>
              {programmingLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* With Groups */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Grouped
          </h3>
          <Select value={country} onValueChange={(v) => setCountry(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a country" />
            </SelectTrigger>
            <SelectContent>
              {groupedCountries.map((group) => (
                <SelectGroup key={group.region}>
                  <SelectLabel>{group.region}</SelectLabel>
                  {group.items.map((item) => (
                    <SelectItem key={item.code} value={item.name}>
                      <span className="mr-2">{getCountryFlag(item.code)}</span>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Disabled State */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Disabled
          </h3>
          <Select disabled>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Disabled select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Option A</SelectItem>
              <SelectItem value="b">Option B</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* With Separator */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            With Separator
          </h3>
          <Select value={tag} onValueChange={(v) => setTag(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {tags.slice(0, 4).map((t) => (
                  <SelectItem key={t.id} value={t.value}>
                    {t.value}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                {tags.slice(4).map((t) => (
                  <SelectItem key={t.id} value={t.value}>
                    {t.value}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Small Size */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Small Size
          </h3>
          <Select>
            <SelectTrigger size="sm" className="w-full">
              <SelectValue placeholder="Small trigger" />
            </SelectTrigger>
            <SelectContent>
              {tags.map((t) => (
                <SelectItem key={t.id} value={t.value}>
                  {t.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pre-selected Value */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Pre-selected
          </h3>
          <Select defaultValue="TypeScript">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {programmingLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}

function AlertDialogShowcase() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Alert Dialog</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Destructive Alert */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Destructive
          </h3>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive">Delete Account</Button>} />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia>
                  <Trash2Icon className="text-destructive" />
                </AlertDialogMedia>
                <AlertDialogTitle>Delete account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All your data will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Warning Alert */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Warning
          </h3>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline">Leave Page</Button>} />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia>
                  <AlertTriangleIcon className="text-amber-500" />
                </AlertDialogMedia>
                <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
                <AlertDialogDescription>
                  You have unsaved changes. Are you sure you want to leave this page?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Stay</AlertDialogCancel>
                <AlertDialogAction variant="secondary">Leave</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Small Size */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Small
          </h3>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="ghost">Clear Data</Button>} />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all local data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive">Clear</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </section>
  );
}

function DialogWithAlertDialogShowcase() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Alert Dialog inside Dialog</h2>
      <p className="text-sm text-muted-foreground">
        An AlertDialog can be triggered from within a Dialog by nesting their triggers.
      </p>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger render={<Button variant="outline">Open Settings</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Manage your account settings and preferences.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium">Danger Zone</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Irreversible actions for your account.
              </p>
              <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogTrigger
                  render={<Button variant="destructive" size="sm" className="mt-3" />}
                >
                  <Trash2Icon />
                  Delete Account
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogMedia>
                      <Trash2Icon className="text-destructive" />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Delete account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. All your data will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={() => setDialogOpen(false)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <DialogFooter>
            <DialogTrigger render={<Button variant="outline">Close</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    us: "🇺🇸",
    ca: "🇨🇦",
    mx: "🇲🇽",
    uk: "🇬🇧",
    de: "🇩🇪",
    fr: "🇫🇷",
    it: "🇮🇹",
    es: "🇪🇸",
    jp: "🇯🇵",
    cn: "🇨🇳",
    kr: "🇰🇷",
    in: "🇮🇳",
    au: "🇦🇺",
    nz: "🇳🇿",
    br: "🇧🇷",
    ar: "🇦🇷",
    za: "🇿🇦",
    eg: "🇪🇬",
  };
  return flags[code] || "🏳️";
}
