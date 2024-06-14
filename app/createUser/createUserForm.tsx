"use client";
// CreateUserForm.tsx

import React, { useState } from "react";
import axios from "axios";
import { BASE_URL, CREATE_USER } from "../api/apiRoutes";
import { toast } from "react-toastify";

interface Props {
  setUserId: any;
}

const CreateUserForm = ({ setUserId }: Props) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setUsername(e.target.value);
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEmail(e.target.value);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BASE_URL}/${CREATE_USER}`, {
        username,
        email,
      });
      if (response?.status === 200) {
        setUserId(response.data.userId);
        toast.success(response?.data?.message);
      } else {
        toast.error(response?.data?.message);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={handleUsernameChange}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={handleEmailChange}
        required
      />
      <button type="submit">Create User</button>
    </form>
  );
};

export default CreateUserForm;