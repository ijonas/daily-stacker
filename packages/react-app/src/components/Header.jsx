import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://github.com/austintgriffith/scaffold-eth" target="_blank" rel="noopener noreferrer">
      <PageHeader
        title="Daily Stacker"
        subTitle="A little dapp for waking up to a little bit more crypto everyday."
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
