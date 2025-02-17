"use client";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownmeu";
import {
  BookOpenCheck,
  LogOut,
  Settings,
  User,
  MoonIcon,
  Sun,
} from "lucide-react";
import {
  useUser,
  useAuth,
  useOrganization,
  useOrganizationList,
} from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
import Link from "next/link";
import { PERMISSIONS, USER_ROLES } from "@/utils/constants";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

type Props = {};

const CustomProfile = (props: Props) => {
  const [open, setIsOpen] = React.useState(false);
  const { signOut, isSignedIn, orgId, orgSlug, userId, orgRole, has } =
    useAuth();
  const [isPersonalProfile, setIsPersonalProfile] = React.useState(true);

  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  let permission = false;
  if (has) {
    // @ts-ignore
    permission = has({
      role: USER_ROLES.principalInvestigator,
      permission: PERMISSIONS.viewFile,
    });
  }

  const {
    isLoaded,
    setActive,
    createOrganization,
    userMemberships,
    userInvitations,
    userSuggestions,
    organizationList,
  } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const router = useRouter();

  const organization = useOrganization();
  return (
    <div>
      <DropdownMenu open={open} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild className="cursor-pointer">
          <Avatar>
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback>{user?.firstName}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 mr-4 mt-2">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Link className="w-full flex" href="/user-profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          <DropdownMenuGroup>
            {organizationList?.map((o) => (
              <DropdownMenuCheckboxItem
                checked={o.membership.organization.id === orgId}
                onCheckedChange={() => {
                  setActive({ organization: o.membership.organization.id });
                  router.replace(`/`);
                }}
                key={o.membership.organization.id}
                className="cursor-pointer"
              >
                <Avatar className="mr-2 h-4 w-4">
                  <AvatarImage src={o.organization.imageUrl} />
                  <AvatarFallback>{o.organization.name[0]}</AvatarFallback>
                </Avatar>
                <span>{o.membership.organization.name}</span>
              </DropdownMenuCheckboxItem>
            ))}
            {orgRole === "admin" && (
              <DropdownMenuItem>
                <Link className="w-full flex" href={`/organization-profile`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Organization
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => setIsOpen(false)}
              disabled={!permission}
            >
              <BookOpenCheck className="mr-2 h-4 w-4" />
              <Link href="/dashboard/teach">Teach Echoes</Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuCheckboxItem
              checked={theme === "light"}
              onCheckedChange={() => {
                setTheme("light");
              }}
              className="cursor-pointer"
            >
              <Sun className="h-4 w-4 mr-2" />
              <span>Light</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={theme === "dark"}
              onCheckedChange={() => {
                setTheme("dark");
              }}
              className="cursor-pointer"
            >
              <MoonIcon className="h-4 w-4 mr-2" />
              <span>Dark</span>
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CustomProfile;
