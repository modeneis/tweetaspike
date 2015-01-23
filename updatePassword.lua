function update(rec,pwd)
  rec.password = pwd
  aerospike:update(rec)
end
