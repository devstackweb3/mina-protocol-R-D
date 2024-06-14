"use client";
import React, { useState } from "react";
import axios from "axios";
import { ADDED_VOTES, BASE_URL } from "../api/apiRoutes";
import { toast } from "react-toastify";

interface Props {
  userId: string | undefined
}

const VoteForm = ({ userId }: Props) => {
  const [option, setOption] = useState("");
  const [voteDate, setVoteDate] = useState(null);
  console.log(voteDate, "voteDate");
  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => setOption(e.target.value);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BASE_URL}/${ADDED_VOTES}`, {
        userId,
        option,
      });
      console.log(response,"ressss" );
      if (response?.status === 200) {
        setOption("");
        setVoteDate(response.data.voteDate);
        toast.success(response.data.message);
      } else {
        toast.error(response?.data?.message);
      }
    } catch (error) {
      console.error("Error recording vote:", error);
      toast.error("Failed to record vote. Please try again.");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Vote Option"
          value={option}
          onChange={handleOptionChange}
          required
        />
        <button type="submit">Vote</button>
      </form>
      {voteDate && (
        <p>
          Vote recorded on: {new Date(voteDate).toLocaleDateString()}{" "}
        </p>
      )}
    </div>
  );
};

export default VoteForm;