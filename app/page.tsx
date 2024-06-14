"use client";

import styles from "./page.module.css";
import CreateUserForm from "./createUser/createUserForm";
import VoteForm from "./voteUser/voteUserForm";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const [userId, setUserId] = useState<any>(null);

  return (
    <div className={styles.main}>
      <h1>Voting Page</h1>
      <CreateUserForm setUserId={setUserId} />
      {userId && <VoteForm userId={userId} />}
      <ToastContainer />
    </div>
  );
}
