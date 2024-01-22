import { Github, Globe, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";
import React from "react";

type Props = {};

const SocialLinks = (props: Props) => {
  return (
    <div className="flex flex-row gap-4">
      <Link href={`https://aashishsinghal.com/`} target="_blank">
        <Globe />
      </Link>
      <Link href={`https://www.linkedin.com/in/iamaashish5/`} target="_blank">
        <Linkedin />
      </Link>
      <Link href={`https://github.com/AashishSinghal`} target="_blank">
        <Github />
      </Link>
      <Link href={`https://twitter.com/BarbarianO_o`} target="_blank">
        <Twitter />
      </Link>
    </div>
  );
};

export default SocialLinks;
