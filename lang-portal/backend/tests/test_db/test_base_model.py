import pytest
from sqlalchemy import Column, Integer, String, ForeignKey, create_engine
from sqlalchemy.orm import relationship, declarative_base, Session
from app.models.base import Base

# Test model that inherits from Base
class TestModel(Base):
    """Test model for base model tests."""
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)

def test_tablename_generation():
    """Test automatic table name generation."""
    assert TestModel.__tablename__ == "testmodel"

def test_metadata_naming_convention():
    """Test metadata naming convention."""
    assert TestModel.metadata.naming_convention is not None

def test_model_string_representation():
    """Test string representation of model."""
    model = TestModel(id=1, name="test")
    assert str(model) == "TestModel(id=1)"

def test_model_repr():
    """Test repr of model."""
    model = TestModel(id=1, name="test")
    assert repr(model) == "TestModel(id=1, name='test')"

def test_model_equality():
    """Test model equality comparison."""
    model1 = TestModel(id=1, name="test")
    model2 = TestModel(id=1, name="test")
    model3 = TestModel(id=2, name="test")

    assert model1 == model2
    assert model1 != model3

def test_model_to_dict():
    """Test model to dictionary conversion."""
    model = TestModel(id=1, name="test")
    assert model.to_dict() == {"id": 1, "name": "test"}

def test_model_column_info():
    """Test model column information."""
    assert hasattr(TestModel, "id")
    assert hasattr(TestModel, "name")
    assert TestModel.id.primary_key
    assert not TestModel.name.nullable

def test_model_relationships():
    """Test relationship handling in base model."""
    engine = create_engine("sqlite:///:memory:")
    Base = declarative_base()

    class TestModelLocal(Base):
        __tablename__ = "testmodel"
        id = Column(Integer, primary_key=True)
        name = Column(String, nullable=False)

    class RelatedModel(Base):
        __tablename__ = "relatedmodel"
        id = Column(Integer, primary_key=True)
        test_id = Column(Integer, ForeignKey("testmodel.id"))
        test = relationship("TestModelLocal", backref="related")

    # Create tables
    Base.metadata.create_all(engine)

    # Create a session
    session = Session(engine)

    # Create test data
    test_model = TestModelLocal(id=1, name="test")
    related_model = RelatedModel(id=1, test_id=1)
    session.add(test_model)
    session.add(related_model)
    session.commit()

    # Test relationships
    assert hasattr(RelatedModel, "test")
    assert hasattr(TestModelLocal, "related")
    assert test_model.related[0] == related_model
    assert related_model.test == test_model

    session.close()

def test_model_validation():
    """Test model validation."""
    with pytest.raises(ValueError, match="name"):
        TestModel(id=1)  # Missing required name field

def test_model_inheritance():
    """Test model inheritance."""
    class DerivedModel(TestModel):
        __tablename__ = "derivedmodel"
        id = Column(Integer, ForeignKey("testmodel.id"), primary_key=True)
        extra = Column(String)

    derived = DerivedModel(id=1, name="test", extra="extra")
    assert isinstance(derived, TestModel)
    assert derived.extra == "extra"