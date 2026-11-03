import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getUsers, updateUserRole } from "../api/users"

function UsersPage() {
    const [users, setUsers] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [roleError, setRoleError] = useState("")
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        setLoading(true)
        setError("")
        getUsers()
            .then(setUsers)
            .catch(() => setError("Could not load users."))
            .finally(() => setLoading(false))
    }, [reloadKey])

    async function changeRole(id, role) {
        setRoleError("")
        try {
            await updateUserRole(id, role)
        } catch (err) {
            setRoleError(err.message)
        }
        setReloadKey((k) => k + 1)
    }

    return (
        <div>
            <Link to="/alerts">Back to alerts</Link>
            <h1>Users</h1>
            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}
            {roleError && <p>{roleError}</p>}
            {users && (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Username</th>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.email}</td>
                                <td>{u.username}</td>
                                <td>
                                    <select
                                        value={u.role}
                                        onChange={(e) => changeRole(u.id, e.target.value)}
                                    >
                                        <option value="analyst">analyst</option>
                                        <option value="admin">admin</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}

export default UsersPage