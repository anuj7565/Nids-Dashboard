import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getUsers, updateUserRole } from "../api/users"

function UsersPage() {
    const [users, setUsers] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [roleError, setRoleError] = useState("")
    const [reloadKey, setReloadKey] = useState(0)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect -- standard fetch-on-change pattern */
        setLoading(true)
        setError("")
        /* eslint-enable react-hooks/set-state-in-effect */
        getUsers()
            .then(setUsers)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [reloadKey])

    async function changeRole(id, role) {
        setRoleError("")
        setSaving(true)
        try {
            await updateUserRole(id, role)
        } catch (err) {
            setRoleError(err.message)
        } finally {
            setSaving(false)
        }
        setReloadKey((k) => k + 1)
    }

    return (
        <div className="page">
            <Link to="/alerts">Back to alerts</Link>
            <h1>Users</h1>
            {loading && <p>Loading...</p>}
            {error && <p className="error" role="alert">{error}</p>}
            {roleError && <p className="error" role="alert">{roleError}</p>}
            {users && (
                <div className="table-wrap">
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
                                            disabled={saving}
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
                </div>
            )}
        </div>
    )
}

export default UsersPage